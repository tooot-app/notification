import Koa from 'koa'
import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { OUTDATED_DAYS } from '../queues/cleanup'

const updateExpoToken = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.state.expoToken) {
    npmlog.warn('updateExpoToken', 'Expo Token not in context state')
    ctx.throw(500, 'updateExpoToken: Expo Token not in context state')
  }

  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken

  const repoET = getRepository(ExpoToken)
  const foundET = await repoET.findOne({
    where: { expoToken },
    cache: {
      id: expoToken,
      milliseconds: 86400000
    }
  })

  if (foundET) {
    const diffTime = Math.abs(Date.now() - foundET.connectedTimestamp.getTime())
    if (diffTime / (1000 * 60 * 60 * 24) > OUTDATED_DAYS / 2)
      await repoET.save({
        expoToken: foundET.expoToken,
        connectedTimestamp: new Date().toISOString()
      })
  } else {
    npmlog.warn('updateExpoToken', 'cannot found corresponding Expo Token')
    ctx.throw(410, 'updateExpoToken: cannot found corresponding Expo Token')
  }

  await next()
}

export default updateExpoToken
