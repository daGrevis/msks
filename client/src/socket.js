import io from 'socket.io-client'

import config from './config'

const socket = io(config.socketUrl, { path: config.socketPath })

export default socket
