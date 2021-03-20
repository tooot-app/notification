import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import logger from 'koa-logger'
import npmlog from 'npmlog'
import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { cleanup } from './queues/cleanup'
import { decode } from './queues/decode'
import { push } from './queues/push'
import redisConfig from './util/redisConfig'
import appRoutes from './routes'
import enableSentry from './util/sentry'

const PORT = process.env.NODE_ENV === 'development' ? 5454 : 80
export const VERSION = 'v1'
const DOMAIN =
  process.env.NODE_ENV === 'development'
    ? 'testpush.tooot.app'
    : 'testheroku.tooot.app'
export const URL = `https://${DOMAIN}/${VERSION}`
export const PUSH_PATH = 'push'

if (!process.env.EXPO_ACCESS_TOKEN_PUSH) {
  throw new Error('Missing Expo access token')
}
if (!process.env.SENTRY_DSN) {
  throw new Error('Missing Sentry DSN')
}

const main = async () => {
  // Setup Postgres
  await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities:
      process.env.NODE_ENV === 'development'
        ? [__dirname + '/entity/*.ts']
        : [__dirname + '/entity/*.js'],
    logging: false,
    synchronize: true,
    cache: {
      type: 'redis',
      options: redisConfig
    }
  }).catch(err => {
    npmlog.error('DB', err)
    throw new Error()
  })
  npmlog.info('DB', 'synced')

  // Setup queues
  cleanup()
  decode()
  push()

  // Koa connections
  const app = new Koa()
  enableSentry(app)
  process.env.DEBUG === 'true' && app.use(logger())
  app.use(
    bodyParser({
      enableTypes: ['json'],
      onerror: (_, ctx) => {
        ctx.throw(422, 'Body parse error')
      }
    })
  )
  app.use(appRoutes())
  app.listen(PORT, () => {
    npmlog.info('Koa', `listening at ${URL}`)
    npmlog.info('Koa', `listening on port ${PORT}`)
  })
}

main()
