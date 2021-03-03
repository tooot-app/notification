const redisConfig = {
  host: process.env.NODE_ENV === 'development' ? 'localhost' : 'redis'
}

export default redisConfig
