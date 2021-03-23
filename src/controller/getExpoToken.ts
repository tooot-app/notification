import Koa from 'koa'
import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { removeCacheExpoToken } from '../util/cacheIdPush'

const getExpoToken = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.state.expoToken) {
    npmlog.warn('getExpoToken', 'Expo Token not in context state')
    ctx.throw(500, 'getExpoToken: Expo Token not in context state')
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

  if (!foundET) {
    await removeCacheExpoToken(expoToken)
    npmlog.warn('getExpoToken', 'cannot found corresponding Expo Token')
    ctx.throw(500, 'getExpoToken: cannot found corresponding Expo Token')
  }

  ctx.state.expoTokenInstance = foundET

  await next()
}

export default getExpoToken
