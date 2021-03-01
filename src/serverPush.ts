import { Expo } from 'expo-server-sdk'
import Koa from 'koa'
import npmlog from 'npmlog'

const serverPush = async (ctx: Koa.Context) => {
  if (!process.env.EXPO_ACCESS_TOKEN_PUSH) {
    npmlog.warn('serverPush', 'missing Expo access token')
    ctx.throw(500, 'serverPush: missing Expo access token')
  }
  const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN_PUSH })

  const commonData = {
    instanceUrl: ctx.state.instanceUrl,
    accountId: ctx.state.accountId
  }

  if (ctx.state.keys) {
    await expo
      .sendPushNotificationsAsync([
        {
          to: `ExponentPushToken[${ctx.state.expoToken}]`,
          sound: 'default',
          badge: 1,
          title: ctx.state.bodyJson.title,
          subtitle: ctx.state.accountFull,
          body: ctx.state.bodyJson.body,
          data: {
            ...commonData,
            notification_id: ctx.state.bodyJson.notification_id
          },
          // @ts-ignore
          categoryId: ctx.state.bodyJson.notification_type
        }
      ])
      .then(res => {
        if (res[0].status === 'error') {
          npmlog.warn('serverPush', res[0].message)
          ctx.throw(500, 'serverPush: push to Expo failed')
        }
      })
      .catch(err => {
        npmlog.warn('serverPush', err)
        ctx.throw(500, 'serverPush: delivery to Expo server failed')
      })
  } else {
    await expo
      .sendPushNotificationsAsync([
        {
          to: `ExponentPushToken[${ctx.state.expoToken}]`,
          sound: 'default',
          badge: 1,
          title: ctx.state.accountFull,
          body: '🔔',
          data: {
            ...commonData
          }
        }
      ])
      .then(res => {
        if (res[0].status === 'error') {
          npmlog.warn('serverPush', res[0].message)
          ctx.throw(500, 'serverPush: push to Expo failed')
        }
      })
      .catch(err => {
        npmlog.warn('serverPush', err)
        ctx.throw(500, 'serverPush: delivery to Expo server failed')
      })
  }
}

export default serverPush
