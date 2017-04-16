const _ = require('lodash')

const client = require('./ircClient')
const config = require('./config')
const queries = require('./queries')
const { formattedVersion } = require('./version')
const { humanizeDelta } = require('./utils')

let connectionTime

const isMe = (client, nick) => client.user.nick === nick

const isPM = message => (
  // Apparently & is a valid prefix for channel.
  !_.startsWith(message.to, '#')
  && !_.startsWith(message.to, '&')
)

const onClose = async () => {
  console.log('client.close called!')
  process.exit(1)
}

const onRegistered = async () => {
  connectionTime = new Date()

  console.log('connected to server!')

  _.forEach(config.ircChannels, channel => {
    console.log(`joining ${channel}...`)
    client.join(channel)
  })
}

const onJoin = async (payload) => {
  await queries.saveMessage({
    kind: 'join',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: '',
  })

  if (isMe(client, payload.nick)) {
    console.log(`joined ${payload.channel}!`)

    await queries.createChannel({ name: payload.channel })
  } else {
    await queries.joinChannel({
      id: [payload.channel, payload.nick],
      channel: payload.channel,
      nick: payload.nick,
    })
  }
}

const onQuit = async (payload) => {
  const now = new Date()

  const channels = await queries.leaveNetwork(payload.nick)
  _.forEach(channels, async (channel) => {
    await queries.saveMessage({
      kind: 'quit',
      timestamp: now,
      from: payload.nick,
      to: channel,
      text: payload.message,
    })
  })
}

const onPart = async (payload) => {
  await queries.saveMessage({
    kind: 'part',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: payload.message,
  })
  await queries.leaveChannel(payload.channel, payload.nick)
}

const onKick = async (payload) => {
  const reason = payload.message === payload.kicked ? '' : payload.message

  await queries.saveMessage({
    kind: 'kick',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: reason,
    kicked: payload.kicked,
  })
  await queries.leaveChannel(payload.channel, payload.kicked)
}

const onNick = async (payload) => {
  const now = new Date()

  const newUsers = await queries.updateNick(payload.nick, payload.new_nick)
  _.forEach(newUsers, async ({ channel }) => {
    await queries.saveMessage({
      kind: 'nick',
      timestamp: now,
      from: payload.nick,
      to: channel,
      text: '',
      newNick: payload.new_nick,
    })
  })
}

const onUserList = async (payload) => {
  const users = _.map(payload.users, ({ nick, modes }) => ({
    id: [payload.channel, nick],
    isOp: _.includes(modes, 'o'),
    isVoiced: _.includes(modes, 'v'),
    channel: payload.channel,
    nick,
  }))

  await queries.updateUsers(payload.channel, users)
}

const onMode = async (payload) => {
  const now = new Date()

  _.forEach(payload.modes, async ({ mode, param }) => {
    const isOp = _.includes(['+o', '-o'], mode)
    const isVoiced = _.includes(['+v', '-v'], mode)

    if (isOp || isVoiced) {
      await queries.saveMessage({
        kind: 'mode',
        timestamp: now,
        from: payload.nick,
        to: payload.target,
        text: mode,
        param,
      })
    }

    if (isOp) {
      await queries.updateUser({
        id: [payload.target, param],
        channel: payload.target,
        nick: param,
        isOp: mode[0] === '+',
      })
    }

    if (isVoiced) {
      await queries.updateUser({
        id: [payload.target, param],
        channel: payload.target,
        nick: param,
        isVoiced: mode[0] === '+',
      })
    }
  })
}

const onTopic = async (payload) => {
  if (payload.nick) {
    await queries.saveMessage({
      kind: 'topic',
      timestamp: new Date(),
      from: payload.nick,
      to: payload.channel,
      text: payload.topic,
    })
  }

  await queries.updateTopic(payload.channel, payload.topic)
}

const onMessage = async (payload) => {
  const now = new Date()

  const message = {
    kind: 'message',
    timestamp: now,
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  }

  await queries.saveMessage(message)

  const isSilent = _.includes(config.silentChannels, message.to)
  if (isSilent) {
    return
  }

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

    await queries.saveMessage({
      kind: 'message',
      timestamp: now,
      from: client.user.nick,
      to: recipient,
      text: response,
    })
  }
}

const onAction = async (payload) => {
  await queries.saveMessage({
    kind: 'action',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  })
}

const onNotice = async (payload) => {
  await queries.saveMessage({
    kind: 'notice',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  })
}

module.exports = {
  onClose,
  onRegistered,
  onJoin,
  onQuit,
  onPart,
  onKick,
  onNick,
  onUserList,
  onMode,
  onTopic,
  onMessage,
  onAction,
  onNotice,
}
