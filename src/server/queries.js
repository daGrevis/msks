const fp = require('lodash/fp')

const r = require('./rethink')

const getInitialChannels = () => (
  r.table('channels')
)

const getInitialUsers = channelName => (
  r.table('users')
  .getAll(channelName, { index: 'channel' })
)

const getInitialMessages = async (channelName) => {
  const messages = await r.table('messages')
    .between([channelName, r.minval], [channelName, r.maxval], { index: 'toAndTimestamp' })
    .orderBy({ index: r.desc('toAndTimestamp') })
    .limit(75)

  return fp.reverse(messages)
}

const getMessagesBefore = async (channelName, timestamp, messageId) => {
  return await (
    r.table('messages')
    .between(
      [channelName, r.minval],
      [channelName, timestamp],
      { index: 'toAndTimestamp' }
    )
    .orderBy({ index: r.desc('toAndTimestamp') })
    .filter(r.row('id').ne(messageId))
    .limit(75)
    .orderBy(r.asc('timestamp'))
  )
}

const getMessagesAfter = async (channelName, timestamp, messageId) => {
  return await (
    r.table('messages')
    .between(
      [channelName, timestamp],
      [channelName, r.maxval],
      { index: 'toAndTimestamp' }
    )
    .orderBy({ index: 'toAndTimestamp' })
    .filter(r.row('id').ne(messageId))
    .limit(75)
  )
}

const getMessagesAround = async (channelName, messageId) => {
  const message = await r.table('messages').get(messageId)

  if (!message) {
    return []
  }

  if (message.to !== channelName) {
    return []
  }

  const messagesBefore = await getMessagesBefore(channelName, message.timestamp, message.id)
  const messagesAfter = await getMessagesAfter(channelName, message.timestamp, message.id)

  return fp.reduce(fp.concat, [], [messagesBefore, [message], messagesAfter])
}

module.exports = {
  getInitialChannels,
  getInitialUsers,
  getInitialMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
}
