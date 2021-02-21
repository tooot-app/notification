import Koa from 'koa'
import npmlog from 'npmlog'
import { body_normal } from '.'

const saveEndpoint = async (ctx: Koa.Context, m: RegExpExecArray) => {
  return await body_normal(ctx, async () => {
    const acct = ctx.request.body.acct
    const deviceId = ctx.request.body.deviceId
    const endpoint = ctx.request.body.endpoint

    npmlog.info(
      'save',
      `saveEndpoint acct=${acct}, deviceId=${deviceId}, endpoint=${endpoint}`
    )

    if (!acct) ctx.throw(422, `missing parameter 'acct'`)
    if (!deviceId) ctx.throw(422, `missing parameter 'deviceId'`)
    if (!endpoint) ctx.throw(422, `missing parameter 'endpoint'`)

    const created = await Endpoint.upsert({
      acct: acct,
      deviceId: deviceId,
      endpoint: endpoint
    })
    npmlog.info('save', `created=${created}`)

    ctx.status = 200
  })
}

export default saveEndpoint
