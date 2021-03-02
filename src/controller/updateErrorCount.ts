import Koa from 'koa'
import npmlog from 'npmlog'
import { getConnection, getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { cacheIdExpoToken } from '../util/cacheIdPush'

const updateErrorCount = async (ctx: Koa.Context, type: 'add' | 'reset') => {
  if (!ctx.state.expoToken) {
    npmlog.warn('updateErrorCount', 'Expo Token not in context state')
    ctx.throw(500, 'updateErrorCount: Expo Token not in context state')
  }
  if (!ctx.state.errorCounts) {
    npmlog.warn('updateErrorCount', 'errorCounts not in context state')
    ctx.throw(500, 'updateErrorCount: errorCounts not in context state')
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
    switch (type) {
      case 'add':
        repoET.save({
          expoToken: foundET.expoToken,
          errorCounts: ctx.state.errorCounts + 1
        })
        break
      case 'reset':
        repoET.save({
          expoToken: foundET.expoToken,
          errorCounts: 0
        })
        break
    }
  } else {
    const connection = getConnection()
    await connection.queryResultCache?.remove([cacheIdExpoToken({ expoToken })])
    npmlog.warn('updateErrorCount', 'cannot found corresponding Expo Token')
    ctx.throw(500, 'updateErrorCount: cannot found corresponding Expo Token')
  }
}

export default updateErrorCount
