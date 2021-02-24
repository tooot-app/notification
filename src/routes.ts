import Router from '@koa/router'
import { PUSH_PATH, VERSION } from '.'
import checkTokens from './controller/checkTokens'
import getExpoToken from './controller/getExpoToken'
import removeUnregister from './controller/removeUnregister'
import saveRegister1 from './controller/saveRegister1'
import saveRegister2 from './controller/saveRegister2'
import updateDecode from './controller/updateDecode'
import decoder from './decoder'
import generateKeys from './generateKeys'
import prepareBaseData from './prepareBaseData'
import returnDefault from './returnDefault'
import returnRegister1 from './returnRegister1'
import serverPush from './serverPush'
import streamContent from './streamContent'

const appRoutes = () => {
  const router = new Router({
    prefix: `/${VERSION}`
  })

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
    streamContent,
    decoder,
    serverPush
  )

  return router.routes()
}

export default appRoutes
