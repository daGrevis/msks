const fp = require('lodash/fp')
const { handleActions } = require('redux-fp')

module.exports = handleActions({
  SET_IRC_CLIENT: ({ payload: { connectionId, ircClient } }) =>
    fp.set(['ircClients', connectionId], ircClient),

  SET_IRC_CLIENT_CONNECTED: ({ payload: { connectionId } }) =>
    fp.pipe(
      fp.set(['isIrcClientConnected', connectionId], true),
      fp.set(['connectionAttempts', connectionId], 0),
    ),
  SET_IRC_CLIENT_DISCONNECTED: ({ payload: { connectionId } }) =>
    fp.set(['isIrcClientConnected', connectionId], false),

  SET_CONNECTION_ATTEMPT: ({ payload: { connectionId, attempt } }) =>
    fp.set(['connectionAttempts', connectionId], attempt),

  SET_IRC_CLIENT_NICK: ({ payload: { connectionId, nick } }) =>
    fp.set(['ircClientNicks', connectionId], nick),

  SET_JOINED_IRC_CHANNEL: ({ payload }) =>
    fp.set(['isJoinedIrcChannel', payload.channelId], true),
  UNSET_JOINED_IRC_CHANNEL: ({ payload }) =>
    fp.unset(['isJoinedIrcChannel', payload.channelId]),

  INCREASE_UNREAD: ({ payload: { channelId } }) =>
    fp.update(['unread', channelId], unread => (unread || 0) + 1),
  RESET_UNREAD: ({ payload: { channelId } }) =>
    fp.set(['unread', channelId], 0),
})
