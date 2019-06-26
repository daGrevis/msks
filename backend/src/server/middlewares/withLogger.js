// Based on https://github.com/koajs/logger

const HttpStatus = require('http-status-codes')

const config = require('../../env/config')
const logger = require('../../env/logger')

const withLogger = () => async (ctx, next) => {
  const startTime = new Date()

  const log = (ctx, e) => {
    const duration = new Date() - startTime

    const status = e
      ? e.status || HttpStatus.INTERNAL_SERVER_ERROR
      : ctx.status || HttpStatus.NOT_FOUND

    if (duration >= config.logger.minServerRequestDuration) {
      logger.log(
        e ? 'error' : 'verbose',
        `[server ${duration}ms] ${status}/${ctx.method} ${ctx.originalUrl}`,
      )
    }
  }

  try {
    await next()
  } catch (e) {
    log(ctx, e)

    throw e
  }

  const res = ctx.res

  // eslint-disable-next-line no-use-before-define
  const onFinish = done.bind(null, 'finish')
  // eslint-disable-next-line no-use-before-define
  const onClose = done.bind(null, 'close')

  res.once('finish', onFinish)
  res.once('close', onClose)

  function done() {
    res.removeListener('finish', onFinish)
    res.removeListener('close', onClose)

    log(ctx)
  }
}

module.exports = withLogger
