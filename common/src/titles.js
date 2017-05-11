const getIndexTitle = () => (
  'msks'
)

const getChannelTitle = channel => (
  `${channel.name} · msks`
)

const getMessageTitle = message => {
  const { from, text } = message
  const timestamp = (
    new Date(message.timestamp)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)
    + 'Z'
  )

  return `${from} on ${timestamp}: ${text}`
}

module.exports = {
  getIndexTitle,
  getChannelTitle,
  getMessageTitle,
}
