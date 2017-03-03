const Promise = require('bluebird')
const _ = require('lodash')
const ircFramework = require('irc-framework')

const { humanizeDelta } = require('./utils')
const config = require('./config')
const queries = require('./queries')
const { formattedVersion } = require('./version')

const isMe = (client, nick) => client.user.nick === nick

console.log('starting bot...')

const bootTime = new Date()
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

function respondToMessage(message, now) {
  let response

  if (message.text === '!ping') {
    response = 'pong'
  } else if (message.text === '!version') {
    response = formattedVersion
  } else if (message.text === '!uptime') {
    const bootUptime = now - bootTime
    const connectionUptime = now - connectionTime

    response = `${humanizeDelta(bootUptime)} (${humanizeDelta(connectionUptime)})`
  }

  if (response) {
    const recipient = isPM(message) ? message.from : message.to

    client.say(recipient, response)
    onMessage(client.user.nick, recipient, response)
  }
}

function onMessage(from, to, text, kind = 'message') {
  const now = new Date()

  const message = {
    from,
    to,
    text,
    kind,
    timestamp: now,
  }

  queries.saveMessage(message)
    .then(() => {
      const isSilentInChannel = _.includes(config.silentChannels, message.to)
      if (!isSilentInChannel) {
        respondToMessage(message, now)
      }
    })
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

client.on('registered', () => {
  connectionTime = new Date()

  console.log('connected to server!')

  _.forEach(config.ircChannels, channel => {
    console.log(`joining ${channel}...`)
    client.join(channel)
  })
})

client.on('join', ({ nick, channel: channelName }) => {
  if (isMe(client, nick)) {
    console.log(`joined ${channelName}!`)

    const channel = { name: channelName }

    queries.createChannel(channel)
  } else {
    const user = {
      id: [channelName, nick],
      channel: channelName,
      nick,
    }

    queries.joinChannel(user)
  }
})

client.on('part', ({ channel, nick }) => {
  queries.leaveChannel(channel, nick)
})

client.on('kick', ({ channel, kicked }) => {
  queries.leaveChannel(channel, kicked)
})

client.on('quit', ({ nick }) => {
  queries.leaveNetwork(nick)
})

client.on('nick', ({ nick, new_nick: newNick }) => {
  queries.updateNick(nick, newNick)
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

client.on('mode', ({ target: channel, modes }) => {
  _.forEach(modes, ({ mode, param }) => {
    if (_.includes(['+o', '-o'], mode)) {
      queries.updateUser({
        id: [channel, param],
        channel,
        nick: param,
        isOp: mode[0] === '+',
      })
    }

    if (_.includes(['+v', '-v'], mode)) {
      queries.updateUser({
        id: [channel, param],
        channel,
        nick: param,
        isVoiced: mode[0] === '+',
      })
    }
  })
})

client.on('topic', ({ channel, topic }) => {
  queries.updateTopic(channel, topic)
})

client.on('privmsg', ({ nick, target, message }) => {
  onMessage(nick, target, message)
})

client.on('action', ({ nick, target, message }) => {
  onMessage(nick, target, message, 'action')
})

module.exports = client
