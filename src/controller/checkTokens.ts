import Koa from 'koa'
import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'
import { cacheIdPush, removeCachePush } from '../util/cacheIdPush'

const checkTokens = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: ExpoToken['expoToken'] = ctx.params.expoToken
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.params.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.params.accountId

  if (!expoToken) {
    npmlog.warn('checkTokens', 'missing expoToken')
    ctx.throw(400, 'checkTokens: missing expoToken')
  }
  if (!instanceUrl) {
    npmlog.warn('checkTokens', 'missing instanceUrl')
    ctx.throw(400, 'checkTokens: missing instanceUrl')
  }
  if (!accountId) {
    npmlog.warn('checkTokens', 'missing accountId')
    ctx.throw(400, 'checkTokens: missing accountId')
  }

  const repoSA = getRepository(ServerAndAccount)
  const foundSA = await repoSA.findOne({
    where: {
      expoToken: { expoToken },
      instanceUrl,
      accountId
    },
    cache: {
      id: cacheIdPush({ expoToken, instanceUrl, accountId }),
      milliseconds: 86400000
    }
  })

  if (foundSA) {
    ctx.state.expoToken = expoToken
    ctx.state.errorCounts = foundSA.expoToken.errorCounts
    ctx.state.instanceUrl = instanceUrl
    ctx.state.accountId = accountId
    ctx.state.serverKey = foundSA.serverKey
    ctx.state.keys = foundSA.keys
    ctx.state.accountFull = foundSA.accountFull
  } else {
    await removeCachePush({ expoToken, instanceUrl, accountId })
    npmlog.warn('checkTokens', 'expoToken does not match or not found')
    ctx.throw(500, 'checkTokens: expoToken does not match or not found')
  }

  await next()
}

export default checkTokens
