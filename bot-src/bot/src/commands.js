const fp = require('lodash/fp')

const { client, ctx } = require('./irc')
const { humanizeDelta } = require('./utils')
const { versionText } = require('./version')

const onPing = async () => {
  return 'pong'
}

const onEcho = async (payload) => {
  return payload
}

const onUptime = async () => {
  return humanizeDelta(new Date() - ctx.connectionTime)
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
  let isAddressedToMe = false
  let hasCommandPrefix = false

  const nickPattern = new RegExp(`^${client.user.nick}[,:]{1} ?`)
  if (nickPattern.test(text)) {
    isAddressedToMe = true
    text = text.replace(nickPattern, '')
  }

  const commandPattern = /^[!,]{1}/
  if (commandPattern.test(text)) {
    hasCommandPrefix = true
    text = text.replace(commandPattern, '')
  }

  const splits = text.split(' ')

  const commandName = splits[0]
  const commandPayload = fp.drop(1, splits).join(' ')

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

  return async () => await command(commandPayload)
}

module.exports = {
  matchCommand,
}
