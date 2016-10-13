const http = require('http')
const socketio = require('socket.io')
const r = require('./rethink')

console.log('starting server...')
var server = http.createServer()
var io = socketio(server)

io.on('connection', (client) => {
  console.log('on io.connection')

  r.table('messages')
    .orderBy({ index: r.desc('timestamp') })
    .changes({ includeInitial: true })
    .filter(
      r.row('new_val')('to').eq('#vim')
    ).run()
    .then(feed => {
      feed.each((err, change) => {
        console.log('emitting message...', change)
        client.emit('message', change)
      })
    })

  client.on('event', (data) => {
    console.log('on client.event')
  })
  client.on('disconnect', () => {
    console.log('on client.disconnect')
  })
})

server.listen(3001)
