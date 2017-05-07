// Based on https://github.com/koajs/logger

const logger = require('./logger')

const log = (ctx, err) => {
  const status = err
    ? (err.status || 500)
    : (ctx.status || 404)

  logger.log(
    err ? 'error' : 'verbose',
    `${status}/${ctx.method} ${ctx.originalUrl}`
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
  const onfinish = done.bind(null, 'finish')
  // eslint-disable-next-line no-use-before-define
  const onclose = done.bind(null, 'close')

  res.once('finish', onfinish)
  res.once('close', onclose)

  function done(event) {
    res.removeListener('finish', onfinish)
    res.removeListener('close', onclose)

    log(ctx)
  }
}

module.exports = koaLogger
