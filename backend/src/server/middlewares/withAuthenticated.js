const HttpStatus = require('http-status-codes')

const withAuthenticated = (ctx, next) => {
  if (!ctx.session) {
    ctx.body = { error: 'Session required!' }
    ctx.status = HttpStatus.UNAUTHORIZED
    return
  }

  return next()
}

module.exports = withAuthenticated
