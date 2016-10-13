const http = require('http')
const socketio = require('socket.io')

console.log('starting server...')
var server = http.createServer()
var io = socketio(server)

io.on('connection', (client) => {
  console.log('on io.connection')

  setInterval(() => {
    console.log('pinging...')
    client.emit('ping', { now: new Date() })
  }, 1000)

  client.on('event', (data) => {
    console.log('on client.event')
  })
  client.on('disconnect', () => {
    console.log('on client.disconnect')
  })
})

server.listen(3001)
