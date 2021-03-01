import Koa from 'koa'
import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const checkTokens = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: string = ctx.params.expoToken
  const instanceUrl: string = ctx.params.instanceUrl
  const accountId: string = ctx.params.accountId

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
      id: `${expoToken}/${instanceUrl}/${accountId}`,
      milliseconds: 86400000
    }
  })

  // https://github.com/typeorm/typeorm/issues/4277
  if (foundSAs[0].instanceUrl === instanceUrl) {
    ctx.state.expoToken = expoToken
    ctx.state.instanceUrl = instanceUrl
    ctx.state.accountId = accountId
    ctx.state.serverKey = foundSAs[0].serverKey
    ctx.state.keys = foundSAs[0].keys
    ctx.state.accountFull = foundSAs[0].accountFull
  } else {
    npmlog.error('checkTokens', 'expoToken does not match or not found')
    ctx.throw(400, 'checkTokens: expoToken does not match or not found')
  }

  await next()
}

export default checkTokens
