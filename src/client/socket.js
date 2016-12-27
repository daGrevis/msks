import io from 'socket.io-client'

const url = process.env.REACT_APP_SOCKETIO_URL || '//:3001'

const socket = io(url)

export default socket
