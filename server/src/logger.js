const winston = require('winston')

const isTestEnv = process.env.NODE_ENV === 'test'

const logger = new (winston.Logger)({
  transports: isTestEnv ? [] : [
    new (winston.transports.Console)({
      colorize: true,
      level: 'debug',
    }),
  ],
})

module.exports = logger
