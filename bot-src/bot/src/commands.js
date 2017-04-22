const fp = require('lodash/fp')

const config = require('./config')
const { client, ctx } = require('./irc')
const { humanizeDelta } = require('./utils')
const { versionText } = require('./version')

const onPing = async () => {
  return 'pong'
}

const onEcho = async ({ params }) => {
  return params
}

const onUptime = async () => {
  return humanizeDelta(new Date() - ctx.connectionTime)
}

const onVersion = async () => {
  return versionText
}

const onReload = async ({ message }) => {
  if (!fp.includes(message.from, config.admins)) {
    return
  }

  console.log(`reloading bot...`)
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
  matchCommand,
}
