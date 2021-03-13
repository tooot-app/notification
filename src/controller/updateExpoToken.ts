import Koa from 'koa'
import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'

const updateExpoToken = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.state.expoToken) {
    npmlog.warn('updateExpoToken', 'Expo Token not in context state')
    ctx.throw(500, 'updateExpoToken: Expo Token not in context state')
  }

  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken

  const repoET = getRepository(ExpoToken)
  const foundET = await repoET.findOne({ where: { expoToken } })

  if (foundET) {
    await repoET.save({
      expoToken: foundET.expoToken,
      connectedTimestamp: new Date(Date.now()).toISOString()
    })
  } else {
    npmlog.warn('updateExpoToken', 'cannot found corresponding Expo Token')
    ctx.throw(410, 'updateExpoToken: cannot found corresponding Expo Token')
  }

  await next()
}

export default updateExpoToken
