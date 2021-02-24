import Koa from 'koa'
import npmlog from 'npmlog'
import slugify from 'slugify'

const prepareBaseData = async (ctx: Koa.Context, next: Koa.Next) => {
  if (
    !ctx.request.body.expoToken ||
    !ctx.request.body.instanceUrl ||
    !ctx.request.body.accountId
  ) {
    npmlog.warn('prepareBaseData', 'missing correct register content')
    ctx.throw(400, 'prepareBaseData: missing correct register content')
  }

  const expoTokenMatch = ctx.request.body.expoToken.match(
    /ExponentPushToken\[(.*)\]/
  )
  if (expoTokenMatch === null) {
    npmlog.error('prepareBaseData', 'expoToken format error')
    ctx.throw(400, 'prepareBaseData: expoToken format error')
  }

  ctx.state.expoToken = expoTokenMatch[1]
  ctx.state.instanceUrl = slugify(ctx.request.body.instanceUrl)
  ctx.state.accountId = ctx.request.body.accountId

  await next()
}

export default prepareBaseData
