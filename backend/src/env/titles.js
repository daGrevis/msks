const getChannelTitle = (serverId, channelName, nick) => {
  if (channelName === '*') {
    return `${serverId} / ${nick}`
  }

  if (!channelName) {
    return 'msks'
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
