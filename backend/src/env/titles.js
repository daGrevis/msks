const getChannelTitle = (serverId, nick, channelName) => {
  if (serverId && channelName === '*') {
    if (nick) {
      return `${serverId} / ${nick}`
    }

    return serverId
  }

  return channelName.replace(/~/g, '#')
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
