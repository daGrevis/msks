const _ = require('lodash')

const logger = require('../logger')
const config = require('../config')
const {
  saveMessage,
  createChannel, updateTopic,
  joinChannel, leaveChannel, leaveNetwork,
  updateUsers, updateUser, updateNick,
} = require('../rethink/queries')
const { indexMessage } = require('../elastic/queries')
const { ircClient, ctx, isMe, isPM } = require('./index')
const { matchCommand } = require('./commands')
const userStore = require('../userStore')

const onDebug = async (s) => {
  if (!config.irc.debug) {
    return
  }

  logger.debug(s)
}

const onClose = async (err) => {
  logger.warn('Connection to IRC server was closed!')
}

const onConnecting = async () => {
  logger.info('Connecting to IRC server...')
}

const onReconnecting = async (payload) => {
  const { attempt, max_retries } = payload

  logger.info(`Reconnecting to IRC server (${attempt}/${max_retries})...`)
}

const onRegistered = async () => {
  ctx.connectionTime = new Date()

  logger.info('Connected to IRC server!')

  logger.info(`Joining channels: ${config.irc.channels}`)
  _.forEach(config.irc.channels, channel => {
    ircClient.join(channel)
  })
}

const onJoin = async (payload) => {
  await saveMessage({
    kind: 'join',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: '',
  })

  if (isMe(payload.nick)) {
    logger.verbose(`Joined ${payload.channel}!`)

    await createChannel({ name: payload.channel })
  } else {
    await joinChannel({
      id: [payload.channel, payload.nick],
      channel: payload.channel,
      nick: payload.nick,
    })
  }
}

const onQuit = async (payload) => {
  const now = new Date()

  const oldUsers = await leaveNetwork(payload.nick)
  for (const oldUser of oldUsers) {
    await saveMessage({
      kind: 'quit',
      timestamp: now,
      from: payload.nick,
      to: oldUser.channel,
      text: payload.message,
      isOp: oldUser.isOp,
      isVoiced: oldUser.isVoiced,
    })
  }
}

const onPart = async (payload) => {
  const user = userStore.get([payload.channel, payload.nick])

  await leaveChannel(payload.channel, payload.nick)

  await saveMessage({
    kind: 'part',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: payload.message,
    isOp: user.isOp,
    isVoiced: user.isVoiced,
  })

}

const onKick = async (payload) => {
  const reason = payload.message === payload.kicked ? '' : payload.message

  await leaveChannel(payload.channel, payload.kicked)

  const user = userStore.get([payload.channel, payload.nick])

  await saveMessage({
    kind: 'kick',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: reason,
    isOp: user.isOp,
    isVoiced: user.isVoiced,
    kicked: payload.kicked,
  })
}

const onNick = async (payload) => {
  const now = new Date()

  const newUsers = await updateNick(payload.nick, payload.new_nick)

  _.forEach(newUsers, async newUser => {
    await saveMessage({
      kind: 'nick',
      timestamp: now,
      from: payload.nick,
      to: newUser.channel,
      text: '',
      isOp: newUser.isOp,
      isVoiced: newUser.isVoiced,
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

  await updateUsers(payload.channel, users)
}

const onMode = async (payload) => {
  const now = new Date()

  for (const { mode, param } of payload.modes) {
    const isOp = _.includes(['+o', '-o'], mode)
    const isVoiced = _.includes(['+v', '-v'], mode)

    if (!isOp && !isVoiced) {
      return
    }

    const targetUser = _.assign(
      userStore.get([payload.target, param]),
      { [isOp ? 'isOp' : 'isVoiced']: mode[0] === '+' }
    )

    await updateUser(targetUser)

    const user = userStore.get([payload.target, payload.nick])

    await saveMessage({
      kind: 'mode',
      timestamp: now,
      from: payload.nick,
      to: payload.target,
      text: mode,
      isOp: user ? user.isOp : false,
      isVoiced: user ? user.isVoiced : false,
      param,
    })
  }
}

const onTopic = async (payload) => {
  if (payload.nick) {
    const user = userStore.get([payload.channel, payload.nick])

    await saveMessage({
      kind: 'topic',
      timestamp: new Date(),
      from: payload.nick,
      to: payload.channel,
      text: payload.topic,
      isOp: user.isOp,
      isVoiced: user.isVoiced,
    })
  }

  await updateTopic(payload.channel, payload.topic)
}

const onMessage = async (payload) => {
  const now = new Date()

  let message = {
    kind: 'message',
    timestamp: now,
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  }

  const isPrivate = isPM(message)

  if (!isPrivate) {
    const user = userStore.get([payload.target, payload.nick])

    message = _.assign(message, {
      isOp: user.isOp,
      isVoiced: user.isVoiced,
    })
  }

  message = await saveMessage(message)
  await indexMessage(message)

  const isSilent = _.includes(config.irc.silentChannels, message.to)
  if (isSilent) {
    return
  }

  const command = matchCommand(message)

  if (!command) {
    return
  }

  const responseText = await command()

  if (!responseText) {
    return
  }

  let responseMessage = {
    kind: 'message',
    timestamp: new Date(),
    from: ircClient.user.nick,
    to: isPrivate ? message.from : message.to,
    text: responseText,
  }

  if (!isPrivate) {
    const responseUser = userStore.get([responseMessage.to, responseMessage.from])

    responseMessage = _.assign(responseMessage, {
      isOp: responseUser.isOp,
      isVoiced: responseUser.isVoiced,
    })
  }

  ircClient.say(responseMessage.to, responseMessage.text)

  responseMessage = await saveMessage(responseMessage)
  await indexMessage(responseMessage)
}

const onAction = async (payload) => {
  const user = userStore.get([payload.target, payload.nick])

  const message = await saveMessage({
    kind: 'action',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.target,
    text: payload.message,
    isOp: user.isOp,
    isVoiced: user.isVoiced,
  })
  await indexMessage(message)
}

const onNotice = async (payload) => {
  const user = userStore.get([payload.target, payload.nick])

  let message = {
    kind: 'notice',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  }

  if (user) {
    message = _.assign(message, {
      isOp: user.isOp,
      isVoiced: user.isVoiced,
    })
  }

  message = await saveMessage(message)
  await indexMessage(message)
}

module.exports = {
  onDebug,
  onClose,
  onConnecting,
  onReconnecting,
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
