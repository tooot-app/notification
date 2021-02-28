import Koa from 'koa'
import npmlog from 'npmlog'
import { getConnection, getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'

const updateExpoToken = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.state.expoToken) {
    npmlog.warn('updateExpoToken', 'Expo Token not in context state')
    ctx.throw(500, 'updateExpoToken: Expo Token not in context state')
  }

  const expoToken = ctx.state.expoToken

  const savedExpoToken = await getRepository(ExpoToken).save({
    expoToken,
    connectedTimestamp: new Date(Date.now()).toISOString()
  })

  if (!savedExpoToken) {
    const connection = getConnection()
    await connection.queryResultCache?.remove([expoToken])
    npmlog.warn('updateExpoToken', 'cannot found corresponding Expo Token')
    ctx.throw(500, 'updateExpoToken: cannot found corresponding Expo Token')
  }

  await next()
}

export default updateExpoToken
