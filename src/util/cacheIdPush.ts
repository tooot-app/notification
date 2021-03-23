import { getConnection } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const cacheIdExpoToken = ({
  expoToken
}: {
  expoToken: ExpoToken['expoToken']
}) => {
  return expoToken
}
const removeCacheExpoToken = async (expoToken: ExpoToken['expoToken']) => {
  const connection = getConnection()
  await connection.queryResultCache?.remove([cacheIdExpoToken({ expoToken })])
}

const cacheIdPush = ({
  expoToken,
  instanceUrl,
  accountId
}: {
  expoToken: ExpoToken['expoToken']
  instanceUrl: ServerAndAccount['instanceUrl']
  accountId: ServerAndAccount['accountId']
}) => {
  return `${expoToken}/${instanceUrl}/${accountId}`
}
const removeCachePush = async ({
  expoToken,
  instanceUrl,
  accountId
}: {
  expoToken: ExpoToken['expoToken']
  instanceUrl: ServerAndAccount['instanceUrl']
  accountId: ServerAndAccount['accountId']
}) => {
  const connection = getConnection()
  await connection.queryResultCache?.remove([
    cacheIdPush({ expoToken, instanceUrl, accountId })
  ])
}

export { cacheIdExpoToken, removeCacheExpoToken, cacheIdPush, removeCachePush }
