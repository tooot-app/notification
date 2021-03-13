import Koa from 'koa'
import { awaitingJobs } from './queues/push'

const checkHealth = async (ctx: Koa.Context, next: Koa.Next) => {
  ctx.response.body = {
    awaiting: awaitingJobs.length
  }

  await next()
}

export default checkHealth
