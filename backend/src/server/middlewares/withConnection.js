const HttpStatus = require('http-status-codes')

const store = require('../../store')

const withConnection = (ctx, next) => {
  const state = store.getState()

  const { connectionId } = ctx.request.body

  if (!connectionId) {
    ctx.body = { error: 'Param connectionId is required!' }
    ctx.status = HttpStatus.BAD_REQUEST
    return
  }

  const connection = state.connections[connectionId]

  if (!connection) {
    ctx.body = { error: 'Connection not found!' }
    ctx.status = HttpStatus.NOT_FOUND
    return
  }

  if (connection.accountId !== ctx.session.accountId) {
    ctx.body = { error: 'Connection forbidden for session!' }
    ctx.status = HttpStatus.FORBIDDEN
    return
  }

  ctx.connection = connection
  return next()
}

module.exports = withConnection
