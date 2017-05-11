function getIndexTitle() {
  return 'msks'
}

function getChannelTitle(channel) {
  return channel.name + ' · msks'
}

function getMessageTitle(message) {
  const timestamp = (
    new Date(message.timestamp)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)
    + 'Z'
  )

  return (
    message.from + ' on ' + timestamp + ': '
    + message.text
  )
}

module.exports = {
  getIndexTitle: getIndexTitle,
  getChannelTitle: getChannelTitle,
  getMessageTitle: getMessageTitle,
}
