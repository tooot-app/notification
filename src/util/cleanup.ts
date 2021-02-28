import schedule from 'node-schedule'
import npmlog from 'npmlog'
import { getRepository, LessThan } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'

const job = async (fireDate: Date) => {
  npmlog.info(
    'schedule',
    `cleaning on ${fireDate.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Amsterdam'
    })}`
  )

  const today = new Date()
  const cleanDate = new Date(today.setDate(today.getDate() - 30)).toISOString()

  const repoET = getRepository(ExpoToken)
  const [foundETs, foundETsCount] = await repoET.findAndCount({
    where: { connectedTimestamp: LessThan(cleanDate) }
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
}

const cleanup = () => {
  schedule.scheduleJob('0 3 * * *', job)
  npmlog.info('schedule', 'daily cleanup scheduled')
}

export default cleanup
