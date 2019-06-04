const ping = require('./ping')
const echo = require('./echo')
const uptime = require('./uptime')
const version = require('./version')

const commands = {
  ping,
  echo,
  uptime,
  version,
}

const getCommand = (connection, payload) => {
  let text = payload.message
  let textBefore

  const nickPattern = new RegExp(`^${connection.nick}[,:] `)
  textBefore = text
  text = text.replace(nickPattern, '')
  const isAddressedToMe = text !== textBefore

  const commandPattern = /^[!,]{1}/
  textBefore = text
  text = text.replace(commandPattern, '')
  const hasCommandPrefix = text !== textBefore

  const separatorPos = text.indexOf(' ')
  const commandName = separatorPos === -1 ? text : text.slice(0, separatorPos)
  const commandParams = separatorPos === -1 ? '' : text.slice(separatorPos + 1)

  const command = commands[commandName]

  if (!command) {
    return {}
  }

  const isSentToMe = payload.target === connection.nick

  if (hasCommandPrefix && isAddressedToMe) {
    return {}
  }

  if (!hasCommandPrefix && !isAddressedToMe && !isSentToMe) {
    return {}
  }

  return {
    command,
    commandName,
    commandParams,
  }
}

module.exports = {
  getCommand,
}
