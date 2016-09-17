const Promise = require('bluebird')
const _ = require('lodash')
const Joi = require('joi')
const irc = require('irc')

const config = require('./config')
const schemas = require('./schemas')
const db = require('./db')

const validate = Promise.promisify(Joi.validate)

const VERSION = '0.0.1'

const isMe = x => x === config.nick

console.log('connecting to IRC server')
const client = new irc.Client(config.server, config.nick, {
  sasl: config.sasl,
  nick: config.nick,
  userName: config.userName,
  password: config.password,
  realName: config.realName,
})

client.on('error', (message) => {
  console.log('error:', message)
})

client.on('registered', () => {
  console.log('connected to IRC server')

  _.forEach(config.channels, channel => {
    client.join(channel)
  })
})

client.on('join', (channel, nick, message) => {
  if (isMe(nick)) {
    console.log(`client joined ${channel}`)
  }
})

client.on('message', (from, to, text) => {
  // Apparently & is a valid prefix.
  const isPrivate = !_.startsWith(to, '#') && !_.startsWith(to, '&')
  const timestamp = new Date()

  const message = {
    from, to, text, isPrivate, timestamp,
  }

  validate(message, schemas.Message).then(message => {
    db.table('messages').insert(message).run()
      .then(() => {
        // Simple indication for activity.
        console.log('.')
      })
      .catch(err => {
        console.error(err)
      })

    if (isMe(to)) {
      if (text === '!version') {
        client.say(from, `msks v${VERSION}`)
      }
    }
  })
})
