import Koa from 'koa'
import npmlog from 'npmlog'
import { getRepository } from 'typeorm'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const saveRegister2 = async (ctx: Koa.Context, next: Koa.Next) => {
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.state.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.state.accountId
  const serverKey: NonNullable<ServerAndAccount['serverKey']> =
    ctx.request.body.serverKey
  const removeKeys: boolean = ctx.request.body.removeKeys

  const repoSA = getRepository(ServerAndAccount)
  const [foundSAs, foundSAsCount] = await repoSA.findAndCount({
    expoToken: ctx.state.expoTokenInstance,
    instanceUrl,
    accountId
  })

  if (foundSAsCount === 0) {
    npmlog.warn('saveRegister2', `register probably failed`)
    ctx.throw(500, 'saveRegister2: register probably failed')
  } else if (foundSAsCount === 1) {
    await repoSA.update(foundSAs[0], {
      ...foundSAs[0],
      serverKey,
      ...(removeKeys && { keys: undefined })
    })
  } else {
    npmlog.warn('saveRegister2', `found too much same, revmoing them all`)
    await repoSA.remove(foundSAs)
    ctx.throw(500, 'saveRegister2: found too much same, revmoing them all')
  }

  await next()
}

export default saveRegister2
