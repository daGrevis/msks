const fp = require('lodash/fp')
const HttpStatus = require('http-status-codes')

const store = require('../../store')

const withChannel = (ctx, next) => {
  const state = store.getState()

  const channelId = ctx.request.body.channelId || ctx.request.query.channelId
  const serverId = ctx.request.body.serverId || ctx.request.query.serverId
  let channelName =
    ctx.request.body.channelName || ctx.request.query.channelName

  if (!channelId && !(serverId && channelName)) {
    ctx.body = {
      error: 'Param channelId or params serverId & channelName are required!',
    }
    ctx.status = HttpStatus.BAD_REQUEST
    return
  }

  let channel

  if (channelId) {
    channel = state.channels[channelId]
  } else if (serverId && channelName) {
    channelName = channelName.replace(/~/g, '#')

    channel = fp.find(
      channel =>
        channel.isPublic &&
        channel.name === channelName &&
        state.connections[channel.connectionId].serverId === serverId,
      state.channels,
    )
  }

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
