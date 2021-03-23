import Koa from 'koa'
import npmlog from 'npmlog'
import { getConnection, getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'
import { cacheIdPush } from '../util/cacheIdPush'

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
  const [foundSAs, foundSAsCount] = await repoSA.findAndCount({
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

  // https://github.com/typeorm/typeorm/issues/4277
  if (foundSAs[0].instanceUrl === instanceUrl) {
    ctx.state.expoToken = expoToken
    ctx.state.errorCounts = foundSAs[0].expoToken.errorCounts
    ctx.state.instanceUrl = instanceUrl
    ctx.state.accountId = accountId
    ctx.state.serverKey = foundSAs[0].serverKey
    ctx.state.keys = foundSAs[0].keys
    ctx.state.accountFull = foundSAs[0].accountFull
  } else {
    const connection = getConnection()
    await connection.queryResultCache?.remove([
      cacheIdPush({ expoToken, instanceUrl, accountId })
    ])
    npmlog.warn('checkTokens', 'expoToken does not match or not found')
    ctx.throw(400, 'checkTokens: expoToken does not match or not found')
  }

  await next()
}

export default checkTokens
