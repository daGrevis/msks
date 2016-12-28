import io from 'socket.io-client'

const url = process.env.REACT_APP_SOCKETIO_URL || '//:3001'
const path = process.env.REACT_APP_SOCKETIO_PATH || '/socket.io'

const socket = io(url, { path })

export default socket
