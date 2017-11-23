global.Promise = require('bluebird')
const fs = require('fs')

const _ = require('lodash')
const Queue = require('promise-queue')
const http = require('http')
const socketio = require('socket.io')
const Koa = require('koa')
const KoaSend = require('koa-send')
const KoaStatic = require('koa-static')
const KoaMount = require('koa-mount')

const config = require('./config')
const logger = require('./logger')
const httpLogger = require('./http/logger')
const httpRouter = require('./http/router')
const actions = require('./socket/actions')
const { ircClient } = require('./irc')
const events = require('./irc/events')
const waitForRethink = require('./rethink/waitForRethink')
const waitForElastic = require('./elastic/waitForElastic')
const rethinkQueries = require('./rethink/queries')

Queue.configure(Promise)

const SERVER_PORT = 3001

process.on('unhandledRejection', reason => {
  console.log(reason)
})

const koa = new Koa()

koa.use(httpLogger())

koa.use(httpRouter.routes())
koa.use(httpRouter.allowedMethods())

koa.use(KoaMount('/main.js', async (ctx) => {
  await KoaSend(ctx, 'apidoc/main.js')
}))
koa.use(KoaMount('/api', async (ctx) => {
  await KoaSend(ctx, 'apidoc/index.html')
}))
koa.use(KoaStatic('apidoc'))

let server = http.createServer(koa.callback())

let io = socketio(server, {
  serveClient: false,
})

const ACTIONS = {
  'server/SUBSCRIBE_TO_CHANNELS': actions.subscribeToChannels,
  'server/SUBSCRIBE_TO_USERS': actions.subscribeToUsers,
  'server/SUBSCRIBE_TO_MESSAGES': actions.subscribeToMessages,
  'server/GET_MESSAGES': actions.getMessages,
  'server/GET_MESSAGES_BEFORE': actions.getMessagesBefore,
  'server/GET_MESSAGES_AFTER': actions.getMessagesAfter,
  'server/GET_MESSAGES_AROUND': actions.getMessagesAround,
  'server/SEARCH_MESSAGES': actions.searchMessages,
}

io.on('connection', socket => {
  let context = {}

  const disconnectEvents = []

  const onDisconnect = ev => {
    disconnectEvents.push(ev)
  }

  socket.on('action', ({ type, payload = null }) => {
    if (!(type in ACTIONS)) {
      logger.warn(`Unknown action: ${type}`)
      return
    }

    const action = ACTIONS[type](payload || {})

    action({ socket, context, onDisconnect })
  })

  socket.on('disconnect', () => {
    disconnectEvents.forEach(onDisconnect => {
      onDisconnect()
    })
  })
})

const eventQueue = new Queue(1, Infinity)

const eventMap = {
  debug: events.onDebug,
  close: events.onClose,
  connecting: events.onConnecting,
  reconnecting: events.onReconnecting,
  registered: events.onRegistered,
  join: events.onJoin,
  quit: events.onQuit,
  part: events.onPart,
  kick: events.onKick,
  nick: events.onNick,
  userlist: events.onUserList,
  mode: events.onMode,
  topic: events.onTopic,
  privmsg: events.onMessage,
  action: events.onAction,
  notice: events.onNotice,
}

_.forEach(eventMap, (promise, eventName) => {
  ircClient.on(eventName, payload => {
    eventQueue.add(() => {
      promise(payload)
        .catch(e => {
          logger.error(`on ${eventName}\n`, payload, '\n', e)
        })
    })
  })
})

Promise.all([
  waitForRethink(),
  waitForElastic(),
]).then(() => {
  server.listen(SERVER_PORT)
  logger.info(`Listening on port ${SERVER_PORT}...`)

  if (config.irc.enable) {
    ircClient.connect()
  }
})

process.on('SIGINT', () => {})
process.on('SIGTERM', async () => {
  if (config.irc.enable) {
    await events.onQuit({
      nick: ircClient.user.nick,
      message: '',
    })
  }

  process.exit()
})
