import asn from 'asn1.js'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import Koa from 'koa'
import npmlog from 'npmlog'
import getRawBody from 'raw-body'

const reAuthorizationWebPush = new RegExp('^WebPush\\s+(\\S+)')
const reCryptoKeySignPublicKey = new RegExp('p256ecdsa=([^;\\s]+)')
const reAuthorizationVapid = new RegExp(
  '^vapid\\s+t=([^\\s,]+)[,\\s]+k=([^\\s,]+)'
)

const body_raw = async (ctx: Koa.Context, next: () => Promise<any>) => {
  ctx.request.body = await getRawBody(ctx.req, {
    limit: '40kb'
  })
  await next()
}

function decodeBase64 (src: string) {
  return Buffer.from(src, 'base64')
}

// ECDSA public key ASN.1 format
const ECPublicKey = asn.define('PublicKey', function () {
  this.seq().obj(
    this.key('algorithm')
      .seq()
      .obj(this.key('id').objid(), this.key('curve').objid()),
    this.key('pub').bitstr()
  )
})

// convert public key from p256ecdsa to PEM
function getPemFromPublicKey (public_key: Buffer) {
  return ECPublicKey.encode(
    {
      algorithm: {
        id: [1, 2, 840, 10045, 2, 1], // :id-ecPublicKey
        curve: [1, 2, 840, 10045, 3, 1, 7] // prime256v1
      },
      pub: {
        // このunused により bitstringの先頭に 00 が置かれる。
        // 先頭の00 04 が uncompressed を示す
        // https://tools.ietf.org/html/rfc5480#section-2.3.2
        // http://www.secg.org/sec1-v2.pdf section 2.3.3
        unused: 0,
        data: public_key
      }
    },
    'pem',
    { label: 'PUBLIC KEY' }
  )
}

function verifyServerKey (ctx: Koa.Context, savedServerKey: string) {
  if (savedServerKey == null || savedServerKey == '3q2+rw') return true

  const crypto_key = ctx.get('Crypto-Key')
  const auth_header = ctx.get('Authorization')
  if (!auth_header) {
    ctx.throw(400, 'missing Authorization header.')
    return false
  }

  let m = reAuthorizationVapid.exec(auth_header)
  if (m) {
    // vapid t=XXX, k=XXX
    const token = m[1]
    const public_key = decodeBase64(m[2])

    if (savedServerKey != null && savedServerKey != '3q2+rw') {
      const saved_key = decodeBase64(savedServerKey)
      if (0 != Buffer.compare(public_key, saved_key)) {
        ctx.throw(400, 'server_key not match.')
        return false
      }
    }

    try {
      const pem = getPemFromPublicKey(public_key)
      jwt.verify(token, Buffer.from(pem), { algorithms: ['ES256'] })
      return true
    } catch (err) {
      console.log(`${err}`)
      ctx.throw(503, `JWT verify failed.`)
      return false
    }
  }

  m = reAuthorizationWebPush.exec(auth_header)
  if (m) {
    // WebPush ...
    const token = m[1]

    if (!crypto_key) {
      ctx.throw(400, 'missing Crypto-Key header.')
      return false
    }
    m = reCryptoKeySignPublicKey.exec(crypto_key)
    if (!m) {
      ctx.throw('Crypto-Key header does not contains p256ecdsa=... part.')
      return false
    }
    const public_key = decodeBase64(m[1])

    if (savedServerKey != null && savedServerKey != '3q2+rw') {
      const saved_key = decodeBase64(savedServerKey)
      if (0 != Buffer.compare(public_key, saved_key)) {
        ctx.throw(400, 'server_key not match.')
        return false
      }
    }

    try {
      const pem = getPemFromPublicKey(public_key)
      jwt.verify(token, Buffer.from(pem), { algorithms: ['ES256'] })
      return true
    } catch (err) {
      console.log(`${err}`)
      ctx.throw(503, `JWT verify failed.`)
      return false
    }
  }

  ctx.throw(400, 'Authorization header is not vapid or WebPush.')
  return false
}

const pushCallback = async (ctx: Koa.Context, m: RegExpExecArray) => {
  return await body_raw(ctx, async () => {
    const params = m[1].split('/').map(x => decodeURIComponent(x))
    const device_id = params[0]
    const acct = params[1]
    const flags = params[2] // may null, not used
    const client_id = params[3] // may null
    const serviceType = params[4]

    const row = await Endpoint.findOne({
      where: {
        acct: acct,
        deviceId: device_id
      }
    })

    if (row != null) {
      console.log(`checkEndpoint: a=${row.endpoint} b=${ctx.url}`)
      if (row.endpoint != ctx.url) {
        ctx.status = 410
        return
      }
    }

    const body = ctx.request.body
    npmlog.info(
      'push',
      `callback device_id=${device_id},acct=${acct},body=${body.length}bytes`
    )

    let serverKey = null
    if (client_id) {
      const row = await ServerKey.findOne({
        where: {
          clientId: client_id
        }
      })
      if (row != null) serverKey = row.serverKey
    }
    if (!verifyServerKey(ctx, serverKey)) {
      npmlog.error('push', 'verifyServerKey failed.')
      return
    }

    try {
      const firebaseMessage = {
        to: device_id,
        priority: 'high',
        data: {
          acct: acct
        }
      }

      const response = await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        JSON.stringify(firebaseMessage),
        {
          headers: {
            Authorization: `key=${process.env.fcmServerKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      npmlog.info(
        'push',
        `sendToFCM: status=${response.status} ${JSON.stringify(response.data)}`
      )

      if (response.data.failure === 0 && response.data.canonical_ids === 0) {
        ctx.status = 201
        return
      }

      response.data.results.forEach((result: any) => {
        if (result.message_id && result.registration_id) {
          // デバイストークンが更新された
          // この購読はキャンセルされるべき
          ctx.status = 410
        } else if (result.error == 'NotRegistered') {
          ctx.status = 410
        } else {
          npmlog.error('push', `sendToFCM error response. ${result.error}`)
          ctx.status = 502
        }
      })
    } catch (err) {
      if (err.response) {
        ctx.throw(
          503,
          `sendToFCM failed. status: ${err.response.status}: ${JSON.stringify(
            err.response.data
          )}`
        )
      } else {
        ctx.throw(503, `sendToFCM failed. ${err}`)
      }
    }
  })
}

export default pushCallback
