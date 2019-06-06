const getChannelTitle = (serverId, channelName, nick) => {
  if (serverId && channelName === '*' && nick) {
    return `${serverId} / ${nick}`
  }

  if (channelName) {
    return channelName.replace(/~/g, '#')
  }

  return 'msks'
}

const getMessageTitle = message => {
  const timestamp =
    new Date(message.createdAt)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19) + 'Z'

  return message.nick + ' on ' + timestamp + ': ' + message.text
}

module.exports = {
  getChannelTitle,
  getMessageTitle,
}
