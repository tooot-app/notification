import * as Sentry from '@sentry/node'
import Koa from 'koa'

const enableSentry = (app: Koa) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.NODE_ENV !== 'development'
  })
  app.on('error', (err, ctx: Koa.Context) => {
    ctx.response.status >= 500 &&
      Sentry.withScope(function (scope) {
        scope.addEventProcessor(function (event) {
          return Sentry.Handlers.parseRequest(event, ctx.request)
        })
        Sentry.captureException(err)
      })
  })
}

export default enableSentry
