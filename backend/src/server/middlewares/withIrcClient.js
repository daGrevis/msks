const HttpStatus = require('http-status-codes')

const store = require('../../store')

const withIrcClient = (ctx, next) => {
  if (!ctx.connection) {
    throw Error('Connection required!')
  }

  const state = store.getState()

  const { connection } = ctx

  const ircClient = state.ircClients[connection.id]

  if (!ircClient || !ircClient.connected) {
    ctx.body = { error: 'Not connected to IRC!' }
    ctx.status = HttpStatus.BAD_REQUEST
    return
  }

  ctx.ircClient = ircClient
  return next()
}

module.exports = withIrcClient
