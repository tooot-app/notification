import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'

const cacheIdExpoToken = ({
  expoToken
}: {
  expoToken: ExpoToken['expoToken']
}) => {
  return expoToken
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

export { cacheIdExpoToken, cacheIdPush }
