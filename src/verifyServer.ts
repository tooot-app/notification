import Koa from 'koa'
import npmlog from 'npmlog'

const regexCryptoKey = new RegExp(/dh=.*;p256ecdsa=(.*)/)

const verifyServer = async (ctx: Koa.Context, next: Koa.Next) => {
  const getCryptoKey = (ctx.req.headers['crypto-key'] as string).match(
    regexCryptoKey
  )

  if (!getCryptoKey || !getCryptoKey[1]) {
    npmlog.warn('verifyServer', 'cannot find serverKey in crypto-key header')
    ctx.throw(500, 'verifyServer: cannot find serverKey in crypto-key header')
  }

  if (`${getCryptoKey[1]}=` !== ctx.state.serverKey) {
    npmlog.warn(
      'verifyServer',
      'serverKey in crypto-key header does not match record'
    )
    ctx.throw(
      500,
      'verifyServer: serverKey in crypto-key header does not match record'
    )
  }

  await next()
}

export default verifyServer
