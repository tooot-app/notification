import Koa from 'koa'
import { decodeQueue } from './queues/decode'
import { pushQueue } from './queues/push'

const checkHealth = async (ctx: Koa.Context, next: Koa.Next) => {
  ctx.response.body = {
    decode: await decodeQueue.getJobCounts(),
    push: await pushQueue.getJobCounts(),
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        decode: await decodeQueue.getWorkers(),
        push: await pushQueue.getWorkers()
      }
    })
  }

  await next()
}

export default checkHealth
