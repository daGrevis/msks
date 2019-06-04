const HttpStatus = require('http-status-codes')

const store = require('../../store')

const withChannel = (ctx, next) => {
  const state = store.getState()

  const channelId = ctx.request.body.channelId || ctx.request.query.channelId

  if (!channelId) {
    ctx.body = { error: 'Param channelId is required!' }
    ctx.status = HttpStatus.BAD_REQUEST
    return
  }

  const channel = state.channels[channelId]

  if (!channel) {
    ctx.body = { error: 'Channel not found!' }
    ctx.status = HttpStatus.NOT_FOUND
    return
  }

  const connection = state.connections[channel.connectionId]

  if (!channel.isPublic) {
    if (!ctx.session) {
      ctx.body = { error: 'Session required!' }
      ctx.status = HttpStatus.UNAUTHORIZED
      return
    }

    if (connection.accountId !== ctx.session.accountId) {
      ctx.body = { error: 'Connection forbidden for session!' }
      ctx.status = HttpStatus.FORBIDDEN
      return
    }
  }

  ctx.channel = channel
  ctx.connection = connection
  return next()
}

module.exports = withChannel
