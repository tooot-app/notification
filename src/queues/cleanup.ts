import Queue from 'bull'
import npmlog from 'npmlog'
import { getRepository, LessThan, MoreThan } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import redisConfig from './redisConfig'

const OUTDATED_DAYS = 30
const OUTDATED_ERRORS = 50

export const cleanupQueue = new Queue<undefined>('Cleanup queue', {
  redis: redisConfig
})

cleanupQueue.add(undefined, { repeat: { cron: '0 3 * * *' } })

cleanupQueue.process(async (_, done) => {
  npmlog.info(
    'schedule',
    `cleaning on ${new Date().toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Amsterdam'
    })}`
  )

  const today = new Date()
  const cleanDate = new Date(
    today.setDate(today.getDate() - OUTDATED_DAYS)
  ).toISOString()

  const repoET = getRepository(ExpoToken)
  const [foundETs, foundETsCount] = await repoET.findAndCount({
    where: [
      { connectedTimestamp: LessThan(cleanDate) },
      { errorCounts: MoreThan(OUTDATED_ERRORS) }
    ]
  })

  if (foundETsCount) {
    npmlog.info(
      'schedule',
      `found ${foundETsCount} outdated connections, removing them`
    )
    await repoET.remove(foundETs)
    npmlog.info('schedule', 'outdated connections removed')
  } else {
    npmlog.info('schedule', 'none outdated connections')
  }

  done()
})
