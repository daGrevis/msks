import io from 'socket.io-client'

import config from './config'

const socket = io(config.socketUrl, {
  path: config.socketPath,
  transports: ['websocket'],
})

socket.on('reconnect_attempt', () => {
  socket.io.opts.transports = ['polling', 'websocket']
})

export default socket
