const winston = require('winston')

const config = require('../env/config')

const isTestEnv = process.env.NODE_ENV === 'test'

const logger = winston.createLogger({
  transports: isTestEnv
    ? []
    : [
        new winston.transports.Console({
          colorize: true,
          level: config.logger.level,
        }),
      ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`),
  ),
})

module.exports = logger
