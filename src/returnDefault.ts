import Koa from 'koa'

const returnDefault = async (ctx: Koa.Context, next: Koa.Next) => {
  await next()

  ctx.response.status = 200
}

export default returnDefault
