import Koa from 'koa'
import npmlog from 'npmlog'

const returnDefault = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next()
  } catch (error) {
    npmlog.error('returnDefault', error)
    ctx.throw(500, 'returnDefault: some process went wrong')
  }

  ctx.response.status = 200
}

export default returnDefault
