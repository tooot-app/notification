import Koa from 'koa'

const returnDefault = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next()
  } catch {
    ctx.throw(400)
  }

  ctx.response.status = 200
}

export default returnDefault
