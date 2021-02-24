import Koa from 'koa'
import npmlog from 'npmlog'
import { getConnection, getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'

const getExpoToken = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.state.expoToken) {
    npmlog.warn('getExpoToken', 'Expo Token not in context state')
    ctx.throw(500, 'getExpoToken: Expo Token not in context state')
  }

  const repoET = getRepository(ExpoToken)
  const foundET = await repoET.findOne({
    where: { expoToken: ctx.state.expoToken },
    cache: {
      id: ctx.state.expoToken,
      milliseconds: 86400000
    }
  })

  if (!foundET) {
    const connection = getConnection()
    await connection.queryResultCache?.remove([ctx.state.expoToken])
    npmlog.warn('getExpoToken', 'cannot found corresponding Expo Token')
    ctx.throw(500, 'getExpoToken: cannot found corresponding Expo Token')
  }

  ctx.state.expoTokenInstance = foundET

  await next()
}

export default getExpoToken
