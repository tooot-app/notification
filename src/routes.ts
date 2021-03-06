import Router from '@koa/router'
import { PUSH_PATH, VERSION } from '.'
import checkHealth from './checkHealth'
import checkTokens from './controller/checkTokens'
import getExpoToken from './controller/getExpoToken'
import removeUnregister from './controller/removeUnregister'
import saveRegister1 from './controller/saveRegister1'
import saveRegister2 from './controller/saveRegister2'
import updateDecode from './controller/updateDecode'
import updateExpoToken from './controller/updateExpoToken'
import generateKeys from './generateKeys'
import prepareBaseData from './prepareBaseData'
import prepareConnect from './prepareConnect'
import returnDefault from './returnDefault'
import returnRegister1 from './returnRegister1'
import streamContent from './streamContent'
import verifyServer from './verifyServer'

const appRoutes = () => {
  const router = new Router({
    prefix: `/${VERSION}`
  })

  router.get('/health', returnDefault, checkHealth)

  router.post(
    '/connect',
    // { expoToken }
    returnDefault,
    prepareConnect,
    updateExpoToken
  )

  router.post(
    '/register1',
    // { expoToken, instanceUrl, accountId, accountFull }
    returnRegister1,
    prepareBaseData,
    generateKeys,
    saveRegister1
  )
  router.post(
    '/register2',
    // { expoToken, instanceUrl, accountId, serverKey, removeKeys }
    returnDefault,
    prepareBaseData,
    getExpoToken,
    saveRegister2
  )

  router.post(
    '/update-decode',
    // { expoToken, instanceUrl, accountId, keys } | { expoToken, instanceUrl, accountId }
    returnDefault,
    prepareBaseData,
    getExpoToken,
    updateDecode
  )

  router.post(
    '/unregister',
    // { expoToken, instanceUrl, accountId }
    returnDefault,
    prepareBaseData,
    removeUnregister
  )

  router.post(
    `/${PUSH_PATH}/:expoToken/:instanceUrl/:accountId`,
    returnDefault,
    checkTokens,
    verifyServer,
    streamContent
  )

  return router.routes()
}

export default appRoutes
