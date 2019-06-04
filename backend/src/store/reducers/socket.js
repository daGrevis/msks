const fp = require('lodash/fp')
const { handleActions } = require('redux-fp')

module.exports = handleActions({
  SET_SOCKET_CLIENT: ({ payload: { socket } }) =>
    fp.set(['socketClients', socket.id], socket),
  UNSET_SOCKET_CLIENT: ({ payload: { socket } }) =>
    fp.unset(['socketClients', socket.id]),

  SET_SOCKET_SESSION: ({ payload: { socket, session } }) =>
    fp.set(['socketSessions', socket.id], session),
})
