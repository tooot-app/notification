import Koa from 'koa'
import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const updateDecode = async (ctx: Koa.Context, next: Koa.Next) => {
  const keys: { auth: string; public: string; private: string } | undefined =
    ctx.request.body.keys

  const instanceUrl: string = ctx.state.instanceUrl
  const accountId: string = ctx.state.accountId

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
    npmlog.info('updateDecode', `found exactly one`)
    repoSA.update(foundSAs[0], { ...foundSAs[0], keys })
  } else {
    npmlog.warn('updateDecode', `found too much same, removing them all`)
    await repoSA.remove(foundSAs)
    ctx.throw(500, 'updateDecode: found too much same, removing them all')
  }

  await next()
}

export default updateDecode
