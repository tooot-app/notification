import Koa from 'koa'
import npmlog from 'npmlog'

const prepareConnect = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.request.body.expoToken) {
    npmlog.warn('prepareConnect', 'missing correct connect content')
    ctx.throw(400, 'prepareConnect: missing correct connect content')
  }

  const expoTokenMatch = ctx.request.body.expoToken.match(
    /ExponentPushToken\[(.*)\]/
  )
  if (expoTokenMatch === null) {
    npmlog.warn('prepareConnect', 'expoToken format error')
    ctx.throw(400, 'prepareConnect: expoToken format error')
  }

  ctx.state.expoToken = expoTokenMatch[1]

  await next()
}

export default prepareConnect
