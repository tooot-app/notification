import Koa from 'koa'
import npmlog from 'npmlog'
import { body_normal } from '.'

const serverKeyUpdate = async (ctx: Koa.Context, m: RegExpExecArray) => {
  return await body_normal(ctx, async () => {
    const client_id = ctx.request.body.client_id
    const server_key = ctx.request.body.server_key

    const user_agent = ctx.get('User-Agent')

    npmlog.info(
      'server',
      `serverKeyUpdate client_id=${client_id}, server_key=${server_key},user_agent=${user_agent}`
    )

    if (!client_id) ctx.throw(422, `missing parameter 'client_id'`)
    if (!server_key) ctx.throw(422, `missing parameter 'server_key'`)

    const created = await ServerKey.upsert({
      clientId: client_id,
      serverKey: server_key
    })
    npmlog.info('server', `created=${created}`)

    ctx.status = 200
  })
}

export default serverKeyUpdate
