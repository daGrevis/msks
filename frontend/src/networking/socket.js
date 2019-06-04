import io from 'socket.io-client'

import config from '../env/config'
import store from '../store'
import { socketConnected } from '../store/actions/socket'

const socket = io(config.socketUrl, {
  path: config.socketPath,
  transports: ['websocket'],
})

socket.on('reconnect_attempt', () => {
  socket.io.opts.transports = ['polling', 'websocket']
})

socket.on('connect', () => {
  store.dispatch(socketConnected())
})
socket.on('disconnect', () => {
  store.dispatch({
    type: 'SOCKET_DISCONNECTED',
  })
})

export default socket
