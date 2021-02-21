import Koa from 'koa'
import npmlog from 'npmlog'
import { ExpoTokens } from '.'

const routeClientUpdate = async (ctx: Koa.Context) => {
  const expoTokenOriginal = ctx.request.body.expoToken
  const serverKey = ctx.request.body.serverKey
  if (!expoTokenOriginal) ctx.throw(400, 'missing -> expoToken')
  if (!serverKey) ctx.throw(400, 'missing -> serverKey')

  const expoTokenMatch = expoTokenOriginal.match(/ExponentPushToken\[(.*)\]/)
  let expoToken: string
  if (expoTokenMatch === null) {
    npmlog.error('update', 'expoToken format error')
    ctx.throw(500, 'expoToken format error')
  } else {
    expoToken = expoTokenMatch[1]
  }

  npmlog.info(
    'update',
    `check expoToken -> ${expoToken} | serverkey -> ${serverKey}`
  )

  const [expo, created] = await ExpoTokens.findOrCreate({
    where: {
      expoToken
    },
    defaults: {
      expoToken,
      serverKey
    }
  })
  if (!expo) {
    ctx.throw(500, `findOrCreate() returns null or empty.`)
  }

  if (!created) {
    npmlog.info('update', `found expoToken -> ${expoToken}`)
    const [updated] = await ExpoTokens.update(
      { serverKey },
      {
        where: {
          expoToken
        }
      }
    )

    if (!updated) {
      ctx.throw(500, `update() returns null or empty.`)
    }
  }
}

export default routeClientUpdate
