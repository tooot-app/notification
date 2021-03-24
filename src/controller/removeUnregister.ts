import Koa from 'koa'
import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'
import { removeCachePush } from '../util/cacheIdPush'

const removeUnregister = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.state.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.state.accountId

  const repoSA = getRepository(ServerAndAccount)
  const foundSA = await repoSA.findOne({
    expoToken: { expoToken },
    instanceUrl,
    accountId
  })

  if (foundSA) {
    await removeCachePush({ expoToken, instanceUrl, accountId })
    await repoSA.remove(foundSA)
  } else {
    npmlog.warn('removeUnregister', `not found any`)
    await removeCachePush({ expoToken, instanceUrl, accountId })
  }

  await next()
}

export default removeUnregister
