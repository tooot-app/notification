import Koa from 'koa'
import npmlog from 'npmlog'

const prepareBaseData = async (ctx: Koa.Context, next: Koa.Next) => {
  if (
    !ctx.request.body.expoToken ||
    !ctx.request.body.instanceUrl ||
    !ctx.request.body.accountId
  ) {
    npmlog.warn('prepareBaseData', 'missing correct register content')
    ctx.throw(400, 'prepareBaseData: missing correct register content')
  }

  ctx.state.expoToken = ctx.request.body.expoToken
  ctx.state.instanceUrl = ctx.request.body.instanceUrl
  ctx.state.accountId = ctx.request.body.accountId

  await next()
}

export default prepareBaseData
