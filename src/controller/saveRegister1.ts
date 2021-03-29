import Koa from 'koa'
import { getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const saveRegister1 = async (ctx: Koa.Context, next: Koa.Next) => {
  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken
  const instanceUrl: ServerAndAccount['instanceUrl'] = ctx.state.instanceUrl
  const accountId: ServerAndAccount['accountId'] = ctx.state.accountId
  const accountFull: ServerAndAccount['accountFull'] =
    ctx.request.body.accountFull

  const savedExpoToken = await getRepository(ExpoToken).save({
    expoToken,
    connectedTimestamp: new Date(Date.now()).toISOString(),
    errorCounts: 0
  })

  const repoSA = getRepository(ServerAndAccount)
  const foundSA = await repoSA.findOne({
    where: {
      expoToken,
      instanceUrl,
      accountId
    }
  })

  // https://github.com/typeorm/typeorm/issues/4477#issuecomment-579142518
  if (foundSA) {
    await repoSA.remove(foundSA)
  }
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
