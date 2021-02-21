import Router from '@koa/router'
import Koa from 'koa'
import accesslog from 'koa-accesslog'
import bodyParser from 'koa-bodyparser'
import npmlog from 'npmlog'
import { DataTypes, Model, Sequelize } from 'sequelize'
import generateKeys from './generateKeys'
import routeClientUpdate from './routeClientUpdate'
import routeServerPush from './routeServerPush'

const URL = 'https://testpush.home.xmflsct.com'

if (!process.env.EXPO_ACCESS_TOKEN_PUSH) {
  throw new Error('Missing Expo access token')
}
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASS) {
  throw new Error('Missing database details.')
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    dialect: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    logging: false
  }
)

interface ExpoTokenAttribute {
  expoToken: string
  serverKey: string
}

interface ExpoTokensInstance
  extends Model<ExpoTokenAttribute>,
    ExpoTokenAttribute {}

export const ExpoTokens = sequelize.define<ExpoTokensInstance>(
  'ExpoTokens',
  {
    expoToken: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    serverKey: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['expoToken']
      }
    ]
  }
)

const main = async () => {
  npmlog.info('DB', 'syncing')
  await ExpoTokens.sync()

  const app = new Koa()
  app.use(accesslog())
  app.use(
    bodyParser({
      enableTypes: ['json'],
      onerror: (_, ctx) => {
        ctx.throw('Body parse error', 422)
      }
    })
  )

  const routerClient = new Router()
  const routerServer = new Router()

  routerClient.post('/register', async ctx => {
    const keys = generateKeys()
    const expoToken = ctx.request.body.expoToken.match(
      /ExponentPushToken\[(.*)\]/
    )[1]

    ctx.response.status = 200
    ctx.response.body = { endpoint: `${URL}/push/${expoToken}`, ...keys }
  })
  routerClient.post('/update', async ctx => {
    await routeClientUpdate(ctx)

    ctx.response.status = 200
  })
  routerClient.post('/unregister', async ctx => {
    ctx.response.status = 200
  })

  routerServer.all('/push/:expoToken', async ctx => {
    await routeServerPush(ctx)

    ctx.response.status = 200
  })

  app.use(routerClient.routes())
  app.use(routerServer.routes())

  // app.use(handleRequest)

  app.listen(5454, () => {
    npmlog.info('Koa', `listening on port ${5454}`)
  })
}

main()
