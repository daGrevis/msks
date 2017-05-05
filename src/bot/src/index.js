const _ = require('lodash')
const Promise = require('bluebird')
const Queue = require('promise-queue')

const { client } = require('./irc')
const events = require('./events')

Queue.configure(Promise)

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

_.forEach(eventMap, (fn, name) => {
  client.on(name, payload => {
    eventQueue.add(() => fn(payload))
  })
})

console.log('starting bot...')
client.connect()
