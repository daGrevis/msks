const fp = require('lodash/fp')

const { humanizeDelta } = require('../utils')
const { versionText } = require('../version')
const { ircClient, ctx, isPrivate } = require('./index')

const onPing = async () => {
  return 'pong'
}

const onEcho = async ({ input }) => {
  return input
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

const commandMap = {
  ping: onPing,
  echo: onEcho,
  uptime: onUptime,
  version: onVersion,
}

const matchCommand = message => {
  let { text } = message
  let textBefore

  const nickPattern = new RegExp(`^${ircClient.user.nick}[,:] `)
  textBefore = text
  text = text.replace(nickPattern, '')
  const isAddressedToMe = text !== textBefore

  const commandPattern = /^[!,]{1}/
  textBefore = text
  text = text.replace(commandPattern, '')
  const hasCommandPrefix = text !== textBefore

  const separatorPos = text.indexOf(' ')

  const commandName = separatorPos === -1 ? text : text.slice(0, separatorPos)
  const commandInput = separatorPos === -1 ? '' : text.slice(separatorPos + 1)

  // Don't respond to own properties like 'constructor'.
  if (!fp.has(commandName, commandMap)) {
    return
  }

  const commandFn = commandMap[commandName]

  if (!commandFn) {
    return
  }

  if (!isPrivate(message) && !hasCommandPrefix && !isAddressedToMe) {
    return
  }

  return {
    fn: commandFn,
    context: {
      input: commandInput,
      message,
    },
  }
}

const getCommand = message => {
  const commandMatch = matchCommand(message)

  if (!commandMatch) {
    return
  }

  const { fn, context } = commandMatch

  return async () => await fn(context)
}

module.exports = {
  onPing,
  onEcho,
  onUptime,
  onVersion,
  matchCommand,
  getCommand,
}
