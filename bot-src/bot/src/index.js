const Promise = require('bluebird')
const _ = require('lodash')
const Joi = require('joi')
const irc = require('irc')

const { humanizeDelta } = require('./utils')
const config = require('./config')
const schemas = require('./schemas')
const r = require('./rethink')

const validate = Promise.promisify(Joi.validate)

const VERSION = '0.0.4'

const isMe = (client, nick) => client.nick === nick

function createChannel(name) {
  const channel = { name }

  validate(channel, schemas.Channel).then(channel => {
    // This creates the channel or silently fails when it exists already.
    r.table('channels').insert(channel).run()
      .catch(_.noop)
  })
}

function joinChannel(nick, channel) {
  const activeUser = { nick, channel }

  validate(activeUser, schemas.ActiveUser).then(() => {
    r.table('active_users').insert(activeUser).run()
  })
}

function leaveChannel(nick, channel) {
  r.table('active_users').filter({ nick, channel }).delete().run()
}

function leaveNetwork(nick) {
  r.table('active_users').filter({ nick }).delete().run()
}

function updateNick(nickOld, nickNew) {
  // Done like this to avoid need of handling updates when listening to changefeed.
  r.table('active_users').filter({ nick: nickOld }).delete({ returnChanges: true }).run()
    .then(({ changes }) => {
      const channels = _.map(changes, 'old_val.channel')
      _.forEach(channels, channel => {
        joinChannel(nickNew, channel)
      })
    })
}

function updateChannelActiveUsers(channel, nicks) {
  const activeUsers = _.map(_.keys(nicks), nick => ({ nick, channel }))

  // TODO: I'm pretty here's a race condition with parallel joins/leaves.
  r.table('active_users').filter({ channel }).delete().run()
    .then(() => {
      r.table('active_users').insert(activeUsers).run()
    })
}

function updateTopic(channel, topic) {
  // TODO: Race condition when this runs before channel exists.
  r.table('channels').get(channel).update({ topic }).run()
}

function onMessage(from, to, text, kind='message') {
  // Apparently & is a valid prefix.
  const isPrivate = !_.startsWith(to, '#') && !_.startsWith(to, '&')
  const timestamp = new Date()

  const message = {
    from, to, text, kind, timestamp,
  }

  validate(message, schemas.Message).then(message => {
    r.table('messages').insert(message).run()
      .then(() => {})
      .catch(err => {
        console.error('error while saving message', err)
      })

    const recipient = isPrivate ? from : to

    if (text === '!ping') {
      client.say(recipient, 'pong')
    }

    if (text === '!version') {
      client.say(recipient, `msks-bot v${VERSION}, https://github.com/daGrevis/msks-bot`)
    }

    if (text === '!uptime') {
      const bootUptime = new Date() - bootTime
      const connectionUptime = new Date() - connectionTime

      client.say(recipient,
        `${humanizeDelta(bootUptime)} (${humanizeDelta(connectionUptime)})`
      )
    }
  })
}

const bootTime = new Date()
let connectionTime

console.log('starting bot...')

const client = new irc.Client(
  config.ircServer, config.ircNick,
  {
    sasl: config.ircSasl,
    nick: config.ircNick,
    userName: config.ircUserName,
    password: config.ircPassword,
    realName: config.ircRealName,
  }
)

client.on('error', err => {
  console.error('error:', err)
})

client.on('netError', err => {
  console.error('network error:', err)
})

client.on('registered', () => {
  connectionTime = new Date()

  console.log('connected to server!')

  _.forEach(config.ircChannels, channel => {
    console.log(`joining ${channel}...`)
    client.join(channel)
  })
})

client.on('join', (channel, nick) => {
  if (isMe(client, nick)) {
    console.log(`joined ${channel}!`)
    createChannel(channel)
  }

  joinChannel(nick, channel)
})

client.on('part', (channel, nick) => {
  leaveChannel(nick, channel)
})

client.on('kick', (channel, nick) => {
  leaveChannel(nick, channel)
})

client.on('kill', nick => {
  leaveNetwork(nick)
})

client.on('quit', nick => {
  leaveNetwork(nick)
})

client.on('nick', (nickOld, nickNew) => {
  updateNick(nickOld, nickNew)
})

client.on('names', (channel, nicks) => {
  updateChannelActiveUsers(channel, nicks)
})

client.on('topic', (channel, topic) => {
  updateTopic(channel, topic)
})

client.on('message', (from, to, text) => {
  onMessage(from, to, text)
})

client.on('selfMessage', (to, text) => {
  onMessage(config.ircNick, to, text)
})

client.on('action', (from, to, text) => {
  onMessage(from, to, text, 'action')
})
