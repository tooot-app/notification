import { Expo, ExpoPushTicket } from 'expo-server-sdk'
import Koa from 'koa'
import npmlog from 'npmlog'
import { getConnection } from 'typeorm'
import updateErrorCount from './controller/updateErrorCount'

const serverPush = async (ctx: Koa.Context) => {
  if (!process.env.EXPO_ACCESS_TOKEN_PUSH) {
    npmlog.warn('serverPush', 'missing Expo access token')
    ctx.throw(500, 'serverPush: missing Expo access token')
  }

  const cacheClear = async () => {
    const connection = getConnection()
    await connection.queryResultCache?.remove([
      `${ctx.state.expoToken}/${ctx.state.instanceUrl}/${ctx.state.accountId}`
    ])
  }

  const checkRes = async (res: ExpoPushTicket[]) => {
    if (res[0].status === 'error') {
      await cacheClear()
      await updateErrorCount(ctx, 'add')
      npmlog.warn('serverPush', res[0].message)
      ctx.throw(500, 'serverPush: push to Expo failed')
    } else {
      if (ctx.state.errorCounts !== 0) {
        await cacheClear()
        await updateErrorCount(ctx, 'reset')
      }
    }
  }

  const catchError = async (err: any) => {
    await cacheClear()
    await updateErrorCount(ctx, 'add')
    npmlog.warn('serverPush', err)
    ctx.throw(500, 'serverPush: delivery to Expo server failed')
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
          categoryId: ctx.state.bodyJson.notification_type,
          channelId: `${ctx.state.accountFull}_${ctx.state.bodyJson.notification_type}`
        }
      ])
      .then(async res => {
        await checkRes(res)
      })
      .catch(async err => {
        await catchError(err)
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
          },
          channelId: `${ctx.state.accountFull}_default`
        }
      ])
      .then(async res => {
        await checkRes(res)
      })
      .catch(async err => {
        await catchError(err)
      })
  }
}

export default serverPush
