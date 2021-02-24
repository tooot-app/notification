import Koa from 'koa'
import { IncomingMessage } from 'node:http'

const streamToBuffer = async (stream: IncomingMessage) => {
  return new Promise((resolve, reject) => {
    const data: any[] = []

    stream.on('data', chunk => {
      data.push(chunk)
    })

    stream.on('end', () => {
      resolve(Buffer.concat(data))
    })

    stream.on('error', err => {
      reject(err)
    })
  })
}

const streamContent = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.state.keys) {
    return next()
  }

  ctx.state.bodyBase64 = await streamToBuffer(ctx.req)

  await next()
}

export default streamContent
