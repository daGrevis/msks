const HttpStatus = require('http-status-codes')

const withParamRequired = param => (ctx, next) => {
  const value = ctx.request.body[param]

  if (!value) {
    ctx.body = { error: `Param ${param} is required!` }
    ctx.status = HttpStatus.BAD_REQUEST
    return
  }

  ctx[param] = value
  return next()
}

module.exports = withParamRequired
