const http = require('http')
const socketio = require('socket.io')

const actions = require('./actions')

let server = http.createServer()
let io = socketio(server, {
  serveClient: false,
})

const ACTIONS = {
  'server/SUBSCRIBE_TO_CHANNELS': actions.subscribeToChannels,
  'server/SUBSCRIBE_TO_USERS': actions.subscribeToUsers,
  'server/SUBSCRIBE_TO_MESSAGES': actions.subscribeToMessages,
  'server/LOAD_MESSAGES': actions.loadMessages,
}

io.on('connection', socket => {
  let context = {
    changefeeds: [],
  }

  socket.on('action', ({ type, payload = null }) => {
    if (!ACTIONS[type]) {
      console.error(`Unknown action: ${type}`)
      return
    }

    const action = ACTIONS[type]
    action(payload || {})({ socket, context })
  })

  socket.on('disconnect', () => {
    const { changefeeds } = context
    changefeeds.forEach(changefeed => {
      changefeed.close()
    })
  })
})

const port = 3001

console.log(`starting server on port ${port}...`)
server.listen(port)
