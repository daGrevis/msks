const _ = require('lodash')

const store = require('../store')
const eventQueue = require('./eventQueue')
const connectionEvents = require('./events/connection')
const trackerEvents = require('./events/tracker')
const botEvents = require('./events/bot')

// https://github.com/kiwiirc/irc-framework/blob/master/docs/events.md
const EVENT_NAMES = [
  'connected',
  'connecting', // Undocumented.
  'reconnecting',
  'close',
  'socket close',
  'socket connected',
  'raw socket connected',
  'server options',
  'irc error', // Undocumented.

  'raw',
  'debug',

  'channel info',
  'userlist',
  'wholist',
  'banlist',
  'topic',
  'topicsetby',
  'join',
  'part',
  'kick',
  'quit',
  'invited',
  'mode', // Undocumented.

  'message',
  'notice',
  'action',
  'privmsg',
  'ctcp response',
  'ctcp request',
  'wallops',

  'nick',
  'account',
  'away',
  'back',
  'nick in use',
  'nick invalid',
  'users online',
  'whois',
  'whowas',
  'user updated',

  'batch start',
  'batch end',
]

const EVENT_SET = [connectionEvents, trackerEvents, botEvents]

const attachEvents = (ircClient, connectionId) => {
  for (const name of EVENT_NAMES) {
    ircClient.on(name, payload => {
      const NOW = new Date()

      const formattedName = _.upperFirst(_.camelCase(name))

      for (const events of EVENT_SET) {
        const promise = events[`on${formattedName}`]
        if (promise) {
          const state = store.getState()

          const connection = state.connections[connectionId]

          eventQueue.add(() =>
            promise({
              payload,
              ircClient,
              connection,
              NOW,
            }),
          )
        }
      }
    })
  }
}

module.exports = attachEvents
