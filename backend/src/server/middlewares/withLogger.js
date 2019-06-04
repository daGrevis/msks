// Based on https://github.com/koajs/logger

const HttpStatus = require('http-status-codes')

const logger = require('../../env/logger')

const log = (ctx, err) => {
  const status = err
    ? err.status || HttpStatus.INTERNAL_SERVER_ERROR
    : ctx.status || HttpStatus.NOT_FOUND

  logger.log(
    err ? 'error' : 'verbose',
    `${status}/${ctx.method} ${ctx.originalUrl}`,
  )
}

const koaLogger = () => async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    log(ctx, err)

    throw err
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

module.exports = koaLogger
