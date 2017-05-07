const winston = require('winston')

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      level: 'debug',
    }),
  ],
})

module.exports = logger
