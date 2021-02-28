import Koa from 'koa'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const saveRegister1 = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: string = ctx.state.expoToken
  const instanceUrl: string = ctx.state.instanceUrl
  const accountId: string = ctx.state.accountId
  const accountFull: string = ctx.request.body.accountFull

  const savedExpoToken = await getRepository(ExpoToken).save({
    expoToken,
    connectedTimestamp: new Date(Date.now()).toISOString()
  })

  const repoSA = getRepository(ServerAndAccount)

  await repoSA.save({
    keys: ctx.state.keys,
    instanceUrl,
    accountId,
    accountFull,
    expoToken: savedExpoToken
  })

  await next()
}

export default saveRegister1
