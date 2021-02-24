import crypto from 'crypto'
import Koa from 'koa'

const generateKeys = async (ctx: Koa.Context, next: Koa.Next) => {
  const keyCurve = crypto.createECDH('prime256v1')
  keyCurve.generateKeys()
  const publicKey = keyCurve.getPublicKey()
  const privateKey = keyCurve.getPrivateKey()
  const auth = crypto.randomBytes(16)

  ctx.state.keys = {
    public: publicKey.toString('base64'),
    private: privateKey.toString('base64'),
    auth: auth.toString('base64')
  }

  await next()
}

export default generateKeys
