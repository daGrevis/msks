const fp = require('lodash/fp')
const { handleActions } = require('redux-fp')

module.exports = handleActions({
  SET_SUBSCRIBED_TO_CONNECTIONS: ({ payload: { socket } }) =>
    fp.set(['isSubscribedToConnections', socket.id], true),

  SET_SUBSCRIBED_TO_CHANNELS: ({ payload: { socket } }) =>
    fp.set(['isSubscribedToChannels', socket.id], true),

  SET_SUBSCRIBED_TO_MESSAGES: ({ payload: { socket, channelId } }) =>
    fp.set(['isSubscribedToMessages', socket.id, channelId], true),

  SET_SUBSCRIBED_TO_USERS: ({ payload: { socket, channelId } }) =>
    fp.set(['isSubscribedToUsers', socket.id, channelId], true),
})
