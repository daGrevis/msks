const Promise = require('bluebird')
const _ = require('lodash')
const ircFramework = require('irc-framework')

const { humanizeDelta } = require('./utils')
const config = require('./config')
const queries = require('./queries')
const { formattedVersion } = require('./version')

const isMe = (client, nick) => client.user.nick === nick

console.log('starting bot...')

let connectionTime

const client = new ircFramework.Client()

function isPM(message) {
  // Apparently & is a valid prefix for channels.
  const isPrivate = (
    !_.startsWith(message.to, '#')
    && !_.startsWith(message.to, '&')
  )

  return isPrivate
}

client.connect({
  host: config.ircHost,
  port: config.ircPort,
  nick: config.ircNick,
  username: config.ircUsername,
  password: config.ircPassword,
  tls: config.ircTls,
  gecos: config.ircGecos,
  auto_reconnect: true,
  auto_reconnect_wait: 1000,
  auto_reconnect_max_retries: 1000,
  version: formattedVersion,
})

client.on('close', () => {
  console.log('client.close called!')
  process.exit(1)
})

client.on('registered', () => {
  connectionTime = new Date()

  console.log('connected to server!')

  _.forEach(config.ircChannels, channel => {
    console.log(`joining ${channel}...`)
    client.join(channel)
  })
})

client.on('join', payload => {
  queries.saveMessage({
    kind: 'join',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: '',
  }).then(() => {
    if (isMe(client, payload.nick)) {
      console.log(`joined ${payload.channel}!`)

      queries.createChannel({ name: payload.channel })
    } else {
      queries.joinChannel({
        id: [payload.channel, payload.nick],
        channel: payload.channel,
        nick: payload.nick,
      })
    }
  })
})

client.on('quit', payload => {
  const now = new Date()

  queries.leaveNetwork(payload.nick).then(channels => {
    _.forEach(channels, channel => {
      queries.saveMessage({
        kind: 'quit',
        timestamp: now,
        from: payload.nick,
        to: channel,
        text: payload.message,
      })
    })
  })
})

client.on('part', payload => {
  queries.saveMessage({
    kind: 'part',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: payload.message,
  }).then(() => {
    queries.leaveChannel(payload.channel, payload.nick)
  })
})

client.on('kick', payload => {
  const reason = payload.message === payload.kicked ? '' : payload.message

  queries.saveMessage({
    kind: 'kick',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: reason,
    kicked: payload.kicked,
  }).then(() => {
    queries.leaveChannel(payload.channel, payload.kicked)
  })
})

client.on('nick', ({ nick, new_nick: newNick }) => {
  const now = new Date()

  queries.updateNick(nick, newNick).then(newUsers => {
    _.forEach(newUsers, ({ channel }) => {
      queries.saveMessage({
        kind: 'nick',
        timestamp: now,
        from: nick,
        to: channel,
        text: '',
        newNick,
      })
    })
  })
})

client.on('userlist', ({ channel, users: ircUsers }) => {
  const users = _.map(ircUsers, ({ nick, modes }) => ({
    id: [channel, nick],
    isOp: _.includes(modes, 'o'),
    isVoiced: _.includes(modes, 'v'),
    channel,
    nick,
  }))

  queries.updateUsers(channel, users)
})

client.on('mode', ({ nick, target: channel, modes }) => {
  const now = new Date()

  _.forEach(modes, ({ mode, param }) => {
    const isOp = _.includes(['+o', '-o'], mode)
    const isVoiced = _.includes(['+v', '-v'], mode)

    if (isOp) {
      queries.updateUser({
        id: [channel, param],
        channel,
        nick: param,
        isOp: mode[0] === '+',
      })
    }

    if (isVoiced) {
      queries.updateUser({
        id: [channel, param],
        channel,
        nick: param,
        isVoiced: mode[0] === '+',
      })
    }

    if (isOp || isVoiced) {
      queries.saveMessage({
        kind: 'mode',
        timestamp: now,
        from: nick,
        to: channel,
        text: mode,
        param,
      })
    }
  })
})

client.on('topic', ({ channel, topic, nick }) => {
  queries.updateTopic(channel, topic)

  if (nick) {
    queries.saveMessage({
      kind: 'topic',
      timestamp: new Date(),
      from: nick,
      to: channel,
      text: topic,
    })
  }
})

client.on('privmsg', payload => {
  const now = new Date()

  const message = {
    kind: 'message',
    timestamp: now,
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  }

  queries.saveMessage(message).then(() => {
    const isSilent = _.includes(config.silentChannels, message.to)
    if (isSilent) {
      return
    }

    const now = new Date()

    let response
    switch (message.text) {
      case '!ping':
        response = 'pong'
        break

      case '!version':
        response = formattedVersion
        break

      case '!uptime':
        response = humanizeDelta(now - connectionTime)
        break
    }

    if (response) {
      const recipient = isPM(message) ? message.from : message.to

      client.say(recipient, response)

      queries.saveMessage({
        kind: 'message',
        timestamp: now,
        from: client.user.nick,
        to: recipient,
        text: response,
      })
    }
  })
})

client.on('action', payload => {
  queries.saveMessage({
    kind: 'action',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  })
})

client.on('notice', payload => {
  queries.saveMessage({
    kind: 'notice',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  })
})

module.exports = client
