import Queue from 'bull'
import Expo from 'expo-server-sdk'
import npmlog from 'npmlog'
import { getConnection } from 'typeorm'
import updateErrorCount from '../controller/updateErrorCount'
import { ExpoToken } from '../entity/ExpoToken'
import { ServerAndAccount } from '../entity/ServerAndAccount'
import redisConfig from './redisConfig'

export type PushJob = {
  context: {
    expoToken: ExpoToken['expoToken']
    errorCounts: ExpoToken['errorCounts']
    instanceUrl: ServerAndAccount['instanceUrl']
    accountId: ServerAndAccount['accountId']
    accountFull: ServerAndAccount['accountFull']
  }
  message?:
    | {
        notification_type:
          | 'follow'
          | 'favourite'
          | 'reblog'
          | 'mention'
          | 'poll'
        notification_id: string
        title: string
        body: string
      }
    | undefined
}

const MAX_BATCH_SIZE = 100
const FORCE_BATCH_MILLIS = 1000 * 5
export let awaitingJobs: {
  job: Queue.Job<PushJob>
  done: Queue.DoneCallback
}[] = []
let processorLocked = false
let lastProcessedBatch = new Date().getTime()

const clearCache = async (
  type: 'add' | 'reset',
  context: {
    expoToken: ExpoToken['expoToken']
    errorCounts: ExpoToken['errorCounts']
    instanceUrl: ServerAndAccount['instanceUrl']
    accountId: ServerAndAccount['accountId']
  }
) => {
  const connection = getConnection()
  await connection.queryResultCache?.remove([
    `${context.expoToken}/${context.instanceUrl}/${context.accountId}`
  ])
  await updateErrorCount(type, context)
}

const processJobs = async (jobsData: PushJob[]) => {
  const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN_PUSH })

  // Create the messages that you want to send to clients
  let messages = []
  for (let job of jobsData) {
    if (job.message) {
      messages.push({
        to: `ExponentPushToken[${job.context.expoToken}]`,
        sound: 'default' as 'default',
        badge: 1,
        title: job.message.title,
        subtitle: job.context.accountFull,
        body: job.message.body,
        data: {
          instanceUrl: job.context.instanceUrl,
          accountId: job.context.accountId,
          notification_id: job.message.notification_id
        },
        categoryId: job.message.notification_type,
        channelId: `${job.context.accountFull}_${job.message.notification_type}`
      })
    } else {
      messages.push({
        to: `ExponentPushToken[${job.context.expoToken}]`,
        sound: 'default' as 'default',
        badge: 1,
        title: job.context.accountFull,
        body: '🔔',
        data: {
          instanceUrl: job.context.instanceUrl,
          accountId: job.context.accountId
        },
        channelId: `${job.context.accountFull}_default`
      })
    }
  }

  const chunk = expo.chunkPushNotifications(messages)[0]
  try {
    const tickets = await expo.sendPushNotificationsAsync(chunk)
    tickets.forEach((ticket, index) => {
      if (
        ticket.status === 'error' &&
        ticket.details?.error === 'DeviceNotRegistered'
      ) {
        {
          npmlog.warn('processJobs', 'add error count')
          clearCache('add', jobsData[index].context)
        }
      } else {
        if (jobsData[index].context.errorCounts) {
          npmlog.warn('processJobs', 'reset error count')
          clearCache('reset', jobsData[index].context)
        }
      }
    })
  } catch (error) {
    npmlog.error('processJobs', error)
  }

  return Promise.resolve()
}

const triggerJobsBatch = async (forceProcess = false) => {
  if (processorLocked) {
    process.env.NODE_ENV === 'development' &&
      npmlog.info('triggerJobsBatch', 'already running')
    return
  }
  if (awaitingJobs.length === 0) {
    process.env.NODE_ENV === 'development' &&
      npmlog.info('triggerJobsBatch', 'no job to process')
    return
  }
  if (awaitingJobs.length < MAX_BATCH_SIZE && !forceProcess) {
    process.env.NODE_ENV === 'development' &&
      npmlog.info('triggerJobsBatch', 'triggering conditions are not met')
    return
  }

  processorLocked = true

  if (awaitingJobs.length > 1) {
    npmlog.info(
      'triggerJobsBatch',
      `Processing ${awaitingJobs.length} jobs${
        forceProcess ? ', forced' : undefined
      }`
    )
  }

  let activeJobsData = awaitingJobs.map(job => job.job.data)
  await processJobs(activeJobsData)
    .then(() => {
      awaitingJobs
        .filter(job => activeJobsData.includes(job.job.data))
        .forEach(job => job.done())
      awaitingJobs = awaitingJobs.filter(
        job => !activeJobsData.includes(job.job.data)
      )
    })
    .catch(e => {
      npmlog.error('triggerJobsBatch', `Error ${e}.`)
      awaitingJobs
        .filter(job => activeJobsData.includes(job.job.data))
        .forEach(job => job.done(e))
      awaitingJobs = awaitingJobs.filter(
        job => !activeJobsData.includes(job.job.data)
      )
    })
  lastProcessedBatch = new Date().getTime()
  processorLocked = false
}

const pushQueue = new Queue<PushJob>('Push queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: true
  }
})

const push = () => {
  npmlog.info('Bull', 'setup push queue')
  pushQueue.process(MAX_BATCH_SIZE, (job, done) => {
    awaitingJobs.push({ job, done })
    triggerJobsBatch()
  })
}

setInterval(() => {
  let forceProcess = false
  if (new Date().getTime() - lastProcessedBatch > FORCE_BATCH_MILLIS) {
    forceProcess = true
  }
  triggerJobsBatch(forceProcess)
}, FORCE_BATCH_MILLIS)

export { push, pushQueue }
