import Koa from 'koa'
import npmlog from 'npmlog'
import { body_normal } from '.'

const tokenCheck = async (ctx: Koa.Context) => {
  return await body_normal(ctx, async () => {
    const token_digest = ctx.request.body.token_digest
    const install_id = ctx.request.body.install_id
    npmlog.info(
      'token',
      `check token_digest=${token_digest},install_id=${install_id}`
    )
    if (!token_digest) ctx.throw(422, `missing parameter 'token_digest'`)
    if (!install_id) ctx.throw(422, `missing parameter 'install_id'`)
    const rows = await WebPushTokenCheck.findOrCreate({
      where: {
        tokenDigest: token_digest
      },
      defaults: {
        installId: install_id
      }
    })
    if (rows == null || rows.length == 0) {
      ctx.throw(500, `findOrCreate() returns null or empty.`)
    }
    let row = rows[0]
    npmlog.info(
      'token',
      `row tokenDigest=${row.tokenDigest}, installId=${row.installId}, updatedAt=${row.updatedAt}`
    )
    if (install_id != row.installId) {
      ctx.status = 403
      ctx.message = `installId not match.`
    } else {
      const affected = await WebPushTokenCheck.update(
        {
          updatedAt: sequelize.literal('CURRENT_TIMESTAMP')
        },
        {
          where: {
            id: row.id
          }
        }
      )
      if (affected[0] != 1) {
        npmlog.info('token', `row update? affected=${affected[0]}`)
      }
      ctx.status = 200
    }
  })
}

export default tokenCheck
