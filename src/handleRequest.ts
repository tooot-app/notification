import Koa from 'koa'
import npmlog from 'npmlog'
import pushCallback from './pushCallback'
import saveEndpoint from './saveEndpoint'
import serverKeyUpdate from './serverKeyUpdate'
import tokenCheck from './tokenCheck'

const rePathCheck = new RegExp('^/webpushtokencheck$')
const rePathCallback = new RegExp('^/webpushcallback/([^\\?#]+)')
const rePathServerKey = new RegExp('/webpushserverkey$')
const rePathEndpoint = new RegExp('^/webpushendpoint$')

const handleRequest = async (ctx: Koa.Context, next: () => Promise<any>) => {
  const method = ctx.request.method
  const path = ctx.request.path
  npmlog.info('request', `${method} ${path}`)

  if (method == 'POST') {
    let m = rePathCheck.exec(path)
    if (m) return await tokenCheck(ctx)

    m = rePathCallback.exec(path)
    if (m) return await pushCallback(ctx, m)

    m = rePathServerKey.exec(path)
    if (m) return await serverKeyUpdate(ctx, m)

    m = rePathEndpoint.exec(path)
    if (m) return await saveEndpoint(ctx, m)
  }
  npmlog.info('request', `status=${ctx.status}`)
  ctx.throw(404, 'Not found')
}

export default handleRequest
