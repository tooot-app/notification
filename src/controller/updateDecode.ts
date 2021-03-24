import Koa from 'koa'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'
import { removeCachePush } from '../util/cacheIdPush'

const updateDecode = async (ctx: Koa.Context, next: Koa.Next) => {
  const keys: ServerAndAccount['keys'] = ctx.request.body.keys

  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.state.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.state.accountId

  const repoSA = getRepository(ServerAndAccount)
  const foundSA = await repoSA.findOneOrFail({
    expoToken: ctx.state.expoTokenInstance,
    instanceUrl,
    accountId
  })

  await removeCachePush({ expoToken, instanceUrl, accountId })
  repoSA.update(foundSA, { ...foundSA, keys })

  await next()
}

export default updateDecode
