import Koa from 'koa'
import { getRepository } from 'typeorm'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const saveRegister2 = async (ctx: Koa.Context, next: Koa.Next) => {
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.state.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.state.accountId
  const serverKey: NonNullable<ServerAndAccount['serverKey']> =
    ctx.request.body.serverKey
  const removeKeys: boolean = ctx.request.body.removeKeys

  const repoSA = getRepository(ServerAndAccount)
  const foundSA = await repoSA.findOneOrFail({
    expoToken: ctx.state.expoTokenInstance,
    instanceUrl,
    accountId
  })

  await repoSA.update(foundSA, {
    ...foundSA,
    serverKey,
    ...(removeKeys && { keys: undefined })
  })

  await next()
}

export default saveRegister2
