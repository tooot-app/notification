import Koa from 'koa'
import npmlog from 'npmlog'
import { PUSH_PATH, URL } from '.'

const returnRegister1 = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next()
  } catch (error) {
    npmlog.error('returnRegister1', error)
    ctx.throw(500, 'returnRegister1: some process went wrong')
  }

  const expoToken = ctx.state.expoToken
  const instanceUrl = ctx.state.instanceUrl
  const accountId = ctx.state.accountId
  const endpoint = `${URL}/${PUSH_PATH}/${expoToken}/${instanceUrl}/${accountId}`

  ctx.response.body = {
    endpoint,
    keys: ctx.state.keys
  }
  ctx.response.status = 200
}

export default returnRegister1
