import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import logger from 'koa-logger'
import npmlog from 'npmlog'
import 'reflect-metadata'
import { createConnection } from 'typeorm'
import appRoutes from './routes'
import enableSentry from './util/sentry'

const PORT = process.env.NODE_ENV === 'development' ? 5454 : 80
export const VERSION = 'v1'
const DOMAIN =
  process.env.NODE_ENV === 'development'
    ? 'test.push.tooot.app'
    : 'push.tooot.app'
export const URL = `https://${DOMAIN}/${VERSION}`
export const PUSH_PATH = 'push3'

if (!process.env.EXPO_ACCESS_TOKEN_PUSH) {
  throw new Error('Missing Expo access token')
}
if (!process.env.SENTRY_DSN) {
  throw new Error('Missing Sentry DSN')
}

const main = async () => {
  await createConnection({
    type: 'postgres',
    host: process.env.NODE_ENV === 'development' ? 'localhost' : 'db',
    database: process.env.TYPEORM_DATABASE,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    entities:
      process.env.NODE_ENV === 'development'
        ? [__dirname + '/entity/*.ts']
        : [__dirname + '/entity/*.js'],
    logging: false,
    synchronize: true,
    cache: {
      type: 'redis',
      options: {
        host: process.env.NODE_ENV === 'development' ? 'localhost' : 'redis',
        port: 6379
      }
    }
  })
  npmlog.info('DB', 'synced')

  const app = new Koa()

  enableSentry(app)

  app.use(logger())
  app.use(
    bodyParser({
      enableTypes: ['json'],
      onerror: (_, ctx) => {
        ctx.throw(422, 'Body parse error')
      }
    })
  )

  const routes = appRoutes()
  app.use(routes)

  app.listen(PORT, () => {
    npmlog.info('Koa', `listening at ${URL}`)
    npmlog.info('Koa', `listening on port ${PORT}`)
  })
}

main()
