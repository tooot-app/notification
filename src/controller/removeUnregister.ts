import Koa from 'koa'
import npmlog from 'npmlog'
import { getConnection, getRepository } from 'typeorm'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const removeUnregister = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: string = ctx.state.expoToken
  const instanceUrl: string = ctx.state.instanceUrl
  const accountId: string = ctx.state.accountId

  const repoSA = getRepository(ServerAndAccount)
  const [foundSAs, foundSAsCount] = await repoSA.findAndCount({
    expoToken: { expoToken },
    instanceUrl,
    accountId
  })

  if (foundSAsCount === 0) {
    npmlog.warn('removeUnregister', `not found matching existing item`)
  } else if (foundSAsCount === 1) {
    npmlog.info('removeUnregister', `found exactly one`)
    const connection = getConnection()
    await connection.queryResultCache?.remove([
      `${expoToken}/${instanceUrl}/${accountId}`
    ])
    await repoSA.remove(foundSAs[0])
  } else {
    npmlog.warn('removeUnregister', `found too much same, removing them all`)
    const connection = getConnection()
    await connection.queryResultCache?.remove([
      `${expoToken}/${instanceUrl}/${accountId}`
    ])
    await repoSA.remove(foundSAs)
  }

  await next()
}

export default removeUnregister
