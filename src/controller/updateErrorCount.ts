import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { removeCacheExpoToken } from '../util/cacheIdPush'

const updateErrorCount = async (
  type: 'add' | 'reset',
  context: {
    expoToken: ExpoToken['expoToken']
    errorCounts: ExpoToken['errorCounts']
  }
) => {
  const expoToken: ExpoToken['expoToken'] = context.expoToken

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
        await repoET.save({
          expoToken: foundET.expoToken,
          errorCounts: context.errorCounts + 1
        })
        break
      case 'reset':
        await repoET.save({
          expoToken: foundET.expoToken,
          errorCounts: 0
        })
        break
    }
  } else {
    await removeCacheExpoToken(expoToken)
    npmlog.warn('updateErrorCount', 'cannot found corresponding Expo Token')
  }
}

export default updateErrorCount
