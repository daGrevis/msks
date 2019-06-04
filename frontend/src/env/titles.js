const getIndexTitle = () => 'msks'

const getChannelTitle = (connection, channel) => {
  if (channel.type === 'server') {
    return `${connection.serverId} / ${connection.nick}`
  }

  return `${channel.name} (${connection.nick})`
}

const getMessageTitle = message => {
  const timestamp =
    new Date(message.createdAt)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19) + 'Z'

  return message.nick + ' on ' + timestamp + ': ' + message.text
}

export { getIndexTitle, getChannelTitle, getMessageTitle }
