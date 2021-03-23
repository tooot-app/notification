import { URL } from 'url'

const redis_uri = new URL(process.env.REDIS_TLS_URL!)

const redisConfig = {
  host: redis_uri.hostname,
  port: Number(redis_uri.port),
  ...(process.env.NODE_ENV === 'production' && {
    password: redis_uri.password,
    tls: {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    }
  })
}

export default redisConfig
