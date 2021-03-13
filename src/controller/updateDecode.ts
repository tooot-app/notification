import Koa from 'koa'
import npmlog from 'npmlog'
import { getConnection, getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'
import { cacheIdPush } from '../util/cacheIdPush'

const updateDecode = async (ctx: Koa.Context, next: Koa.Next) => {
  const keys: ServerAndAccount['keys'] = ctx.request.body.keys

  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.state.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.state.accountId

  const repoSA = getRepository(ServerAndAccount)
  const [foundSAs, foundSAsCount] = await repoSA.findAndCount({
    expoToken: ctx.state.expoTokenInstance,
    instanceUrl,
    accountId
  })

  if (foundSAsCount === 0) {
    npmlog.warn('updateDecode', `not found matching existing item`)
    ctx.throw(500, 'updateDecode: not found matching existing item')
  } else if (foundSAsCount === 1) {
    if (!keys) {
      const connection = getConnection()
      await connection.queryResultCache?.remove([
        cacheIdPush({ expoToken, instanceUrl, accountId })
      ])
    }
    repoSA.update(foundSAs[0], { ...foundSAs[0], keys })
  } else {
    npmlog.warn('updateDecode', `found too much same, removing them all`)
    await repoSA.remove(foundSAs)
    ctx.throw(500, 'updateDecode: found too much same, removing them all')
  }

  await next()
}

export default updateDecode
