const fp = require('lodash/fp')

const logger = require('../logger')
const config = require('../config')
const { leaveNetwork, saveMessage } = require('../rethink/queries')
const { humanizeDelta } = require('../utils')
const { versionText } = require('../version')
const { ircClient, ctx } = require('./index')

const onPing = async () => {
  return 'pong'
}

const onEcho = async ({ params }) => {
  return params
}

const onUptime = async () => {
  if (ctx.connectionTime) {
    return humanizeDelta(new Date() - ctx.connectionTime)
  } else {
    return 0
  }
}

const onVersion = async () => {
  return versionText
}

const onReload = async ({ message }) => {
  if (!fp.includes(message.from, config.irc.admins)) {
    return
  }

  logger.info(`!reload requested by ${message.from}, exiting...`)

  const now = new Date()

  const users = await leaveNetwork(ircClient.user.nick)
  for (const user of users) {
    await saveMessage({
      kind: 'quit',
      timestamp: now,
      from: user.nick,
      to: user.channel,
      text: '',
    })
  }

  process.exit(0)
}

const commandMap = {
  ping: onPing,
  echo: onEcho,
  uptime: onUptime,
  version: onVersion,
  reload: onReload,
}

const matchCommand = message => {
  let { text } = message
  let isAddressedToMe = false
  let hasCommandPrefix = false

  const nickPattern = new RegExp(`^${ircClient.user.nick}[,:]{1} ?`)
  if (nickPattern.test(text)) {
    isAddressedToMe = true
    text = text.replace(nickPattern, '')
  }

  const commandPattern = /^[!,]{1}/
  if (commandPattern.test(text)) {
    hasCommandPrefix = true
    text = text.replace(commandPattern, '')
  }

  const separatorPos = text.indexOf(' ')

  const commandName = separatorPos === -1 ? text : text.slice(0, separatorPos)
  const commandParams = separatorPos === -1 ? '' : text.slice(separatorPos + 1)

  const command = commandMap[commandName]

  if (!command) {
    return
  }
  if (!hasCommandPrefix && !isAddressedToMe) {
    return
  }
  if (hasCommandPrefix && isAddressedToMe) {
    return
  }

  return async () => await command({
    params: commandParams,
    message,
  })
}

module.exports = {
  onPing,
  onEcho,
  onUptime,
  onVersion,
  matchCommand,
}
