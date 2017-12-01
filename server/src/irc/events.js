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
const { ircClient, ctx, isMe, isPrivate } = require('./index')
const { getCommand } = require('./commands')
const userStore = require('../userStore')
const rateLimitStore = require('../rateLimitStore')

const setUserModes = message => {
  const user = userStore.get([message.to, message.from])

  return !user ? message : _.assign(message, {
    isOp: user.isOp,
    isVoiced: user.isVoiced,
  })
}

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

  await joinChannel({
    id: [payload.channel, payload.nick],
    channel: payload.channel,
    nick: payload.nick,
  })

  if (isMe(payload.nick)) {
    logger.verbose(`Joined ${payload.channel}!`)

    await createChannel({ name: payload.channel })
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
  await leaveChannel(payload.channel, payload.nick)

  await saveMessage(setUserModes({
    kind: 'part',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: payload.message,
  }))
}

const onKick = async (payload) => {
  const reason = payload.message === payload.kicked ? '' : payload.message

  await leaveChannel(payload.channel, payload.kicked)

  await saveMessage(setUserModes({
    kind: 'kick',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.channel,
    text: reason,
    kicked: payload.kicked,
  }))

  if (isMe(payload.kicked)) {
    logger.warn(`Kicked by ${payload.nick}, rejoining ${payload.channel}!`)

    ircClient.join(payload.channel)
  }
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

    const targetUser = {
      id: [payload.target, param],
      channel: payload.target,
      nick: param,
      ...userStore.get([payload.target, param]),
      [isOp ? 'isOp' : 'isVoiced']: (mode[0] === '+'),
    }

    await updateUser(targetUser)

    await saveMessage(setUserModes({
      kind: 'mode',
      timestamp: now,
      from: payload.nick,
      to: payload.target,
      text: mode,
      param,
    }))
  }
}

const onTopic = async (payload) => {
  if (payload.nick) {
    await saveMessage(setUserModes({
      kind: 'topic',
      timestamp: new Date(),
      from: payload.nick,
      to: payload.channel,
      text: payload.topic,
    }))
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

  const isPM = isPrivate(message)

  if (!isPM) {
    message = setUserModes(message)

    message = await saveMessage(message)
    await indexMessage(message)
  }

  const isSilent = _.includes(config.irc.silentChannels, message.to)
  if (isSilent) {
    return
  }

  const command = getCommand(message)

  if (!command) {
    return
  }

  const prevLimit = rateLimitStore.get(message.from) || {
    allowance: config.irc.limitRate,
    timestamp: now,
  }

  const timePassed = now - prevLimit.timestamp

  let { allowance } = prevLimit

  allowance += timePassed * (config.irc.limitRate / config.irc.limitPer)

  if (allowance > config.irc.limitRate) {
    allowance = config.irc.limitRate
  }

  allowance -= 1

  const isRateLimited = allowance < 0

  rateLimitStore.set(message.from, {
    allowance,
    timestamp: now,
  })

  if (isRateLimited && prevLimit.allowance >= 0) {
    ircClient.say(message.from, `Per-user rate limit exceeded, stop the spam!`)
  }

  if (isRateLimited) {
    logger.verbose(`Rate-limited message from ${message.from} (allowance: ${_.round(allowance, 2)})`)

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
    to: isPM ? message.from : message.to,
    text: responseText,
  }

  if (!isPM) {
    responseMessage = setUserModes(responseMessage)
  }

  ircClient.say(responseMessage.to, responseMessage.text)

  responseMessage = await saveMessage(responseMessage)
  await indexMessage(responseMessage)
}

const onAction = async (payload) => {
  const message = await saveMessage(setUserModes({
    kind: 'action',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  }))
  await indexMessage(message)
}

const onNotice = async (payload) => {
  if (payload.target === '*' || payload.target === ircClient.user.nick) {
    return
  }

  const message = await saveMessage(setUserModes({
    kind: 'notice',
    timestamp: new Date(),
    from: payload.nick,
    to: payload.target,
    text: payload.message,
  }))
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
