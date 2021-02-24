import { Expo } from 'expo-server-sdk'
import Koa from 'koa'
import npmlog from 'npmlog'

const serverPush = async (ctx: Koa.Context) => {
  const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN_PUSH })

  if (ctx.state.keys) {
    await expo
      .sendPushNotificationsAsync([
        {
          to: `ExponentPushToken[${ctx.state.expoToken}]`,
          sound: 'default',
          title: ctx.state.bodyJson.title,
          subtitle: ctx.state.accountFull,
          body: ctx.state.bodyJson.body,
          data: { url: `tooot://push/${ctx.state.bodyJson.notification_id}` },
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
      .catch(() => {
        npmlog.warn('serverPush', 'delivery to Expo server faild')
        ctx.throw(500, 'serverPush: delivery to Expo server failed')
      })
  } else {
    await expo
      .sendPushNotificationsAsync([
        {
          to: `ExponentPushToken[${ctx.state.expoToken}]`,
          sound: 'default',
          title: ctx.state.accountFull,
          body: '🔔'
        }
      ])
      .then(res => {
        if (res[0].status === 'error') {
          npmlog.warn('serverPush', res[0].message)
          ctx.throw(500, 'serverPush: push to Expo failed')
        }
      })
      .catch(() => {
        npmlog.warn('serverPush', 'delivery to Expo server faild')
        ctx.throw(500, 'serverPush: delivery to Expo server failed')
      })
  }
}

export default serverPush
