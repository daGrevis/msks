const r = require('./rethink')

const getInitialChannels = () => (
  r.table('channels')
)

const getInitialUsers = channelName => (
  r.table('users')
  .getAll(channelName, { index: 'channel' })
)

const getInitialMessages = channelName => (
  r.table('messages')
  .between([channelName, r.minval], [channelName, r.maxval], { index: 'toAndTimestamp' })
  .orderBy({ index: r.desc('toAndTimestamp') })
  .limit(75)
)

const getMessagesBefore = (channelName, timestamp, messageId) => (
  r.table('messages')
  .between(
    [channelName, r.minval],
    [channelName, r.ISO8601(timestamp)],
    { index: 'toAndTimestamp' }
  )
  .orderBy({ index: r.desc('toAndTimestamp') })
  .filter(r.row('id').ne(messageId))
  .limit(100)
)

const getMessagesAfter = (channelName, timestamp, messageId) => (
  // TODO: Add limit and retry requests on client.
  r.table('messages')
  .between([channelName, r.ISO8601(timestamp)], [channelName, r.maxval], { index: 'toAndTimestamp' })
  .orderBy({ index: r.desc('toAndTimestamp') })
  .filter(r.row('id').ne(messageId))
)

module.exports = {
  getInitialChannels,
  getInitialUsers,
  getInitialMessages,
  getMessagesBefore,
  getMessagesAfter,
}
