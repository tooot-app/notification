import { Expo } from 'expo-server-sdk'
import Koa from 'koa'
import npmlog from 'npmlog'
import { ExpoTokens } from '.'

const routeServerPush = async (ctx: Koa.Context) => {
  const expoToken = ctx.params.expoToken

  if (!expoToken) {
    ctx.throw(400, 'missing expoToken')
  }

  npmlog.info('push', `push to expoToken -> ${expoToken}`)

  const project = await ExpoTokens.findOne({ where: { expoToken } })
  if (project === null) {
    npmlog.error('push', 'expoToken not found')
    ctx.throw(400, 'expoToken not found')
  } else {
    // if (project.serverKey) {
    // }
    const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN_PUSH })
    return await expo
      .sendPushNotificationsAsync([
        {
          to: `ExponentPushToken[${expoToken}]`,
          sound: 'default',
          title: 'Original Title',
          body: 'And here is the body!',
          data: { someData: 'goes here' }
        }
      ])
      .then(res => {
        if (res[0].status === 'error') {
          npmlog.warn('push', res[0].message)
        }
      })
      .catch(() => {
        npmlog.error('push', 'delivery to Expo server faild')
        ctx.throw(500, 'delivery to Expo server failed')
      })
  }
}

export default routeServerPush
