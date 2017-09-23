const Promise = require('bluebird')
const _ = require('lodash')
const fp = require('lodash/fp')

const r = require('./index')
const { validate } = require('../schemas')
const schemas = require('../schemas')
const retry = require('../retry')
const userStore = require('../userStore')

const createChannel = async function(channel) {
  await validate(channel, schemas.Channel)

  // Creates the channel or silently fails when it exists already.
  await r.table('channels').insert(channel).run().catch(_.noop)
}

const joinChannel = async function(user) {
  await validate(user, schemas.User)

  await r.table('users').insert(user, { conflict: 'replace' }).run()

  userStore.set(user.id, user)
}

const leaveChannel = async function(channel, nick) {
  const userId = [channel, nick]

  await r.table('users').get(userId).delete().run()

  userStore.delete(userId)
}

const leaveNetwork = async function(nick) {
  const { changes } = await r.table('users').getAll(nick, { index: 'nick' })
    .delete({ returnChanges: true }).run()

  const oldUsers = _.map(changes, 'old_val')

  _.forEach(oldUsers, oldUser => {
    userStore.delete(oldUser.id)
  })

  return oldUsers
}

const updateNick = async function(nick, newNick) {
  const { changes } = await r.table('users').getAll(nick, { index: 'nick' })
    .delete({ returnChanges: true }).run()

  const oldUsers = _.map(changes, 'old_val')

  _.forEach(oldUsers, oldUser => {
    userStore.delete(oldUser.id)
  })

  const newUsers = _.map(oldUsers, oldUser => ({
    id: [oldUser.channel, newNick],
    channel: oldUser.channel,
    nick: newNick,
    isOp: oldUser.isOp,
    isVoiced: oldUser.isVoiced,
  }))
  await Promise.all(_.map(newUsers, user => validate(user, schemas.User)))

  await r.table('users').insert(newUsers, { conflict: 'replace' }).run()

  _.forEach(newUsers, newUser => {
    userStore.set(newUser.id, newUser)
  })

  return newUsers
}

const updateUsers = async function(channel, users) {
  await Promise.all(_.map(users, user => validate(user, schemas.User)))

  await r.table('users').getAll(channel, { index: 'channel' }).delete().run()

  _.filter(userStore.values(), { channel }).forEach(cachedUser => {
    userStore.delete(cachedUser.id)
  })

  await r.table('users').insert(users, { conflict: 'replace' }).run()

  _.map(users, user => {
    userStore.set(user.id, user)
  })
}

const updateUser = async function(user) {
  await validate(user, schemas.User)

  await r.table('users').get(user.id).update(user).run()

  userStore.set(user.id, user)
}

const updateTopic = async function(channel, topic) {
  await r.table('channels').get(channel).update({ topic }).run()
}

const saveMessage = async function(message) {
  if (!message.isOp) {
    delete message.isOp
  }
  if (!message.isVoiced) {
    delete message.isVoiced
  }

  await validate(message, schemas.Message)

  const changes = await r.table('messages').insert(message).run()
  const id = changes.generated_keys[0]

  return fp.assign(message, { id })
}

const getChannels = async () => {
  return await (
    r.table('channels')
  )
}
const getUsers = async (channelName, nick) => {
  let rq = (
    r.table('users')
    .getAll(channelName, { index: 'channel' })
  )
  if (nick) {
    rq = rq.filter({ nick: nick })
  }
  return await rq
}

const getMessages = async (channel, limit) => {
  const messages = await (
    r.table('messages')
    .between(
      [channel, r.minval],
      [channel, r.maxval],
      { index: 'toAndTimestamp' }
    )
    .orderBy({ index: r.desc('toAndTimestamp') })
    .limit(limit)
  )

  return fp.reverse(messages)
}

const getMessagesBefore = async (message, limit) => {
  const minTimestamp = r.minval
  const maxTimestamp = message.timestamp

  return await (
    r.table('messages')
    .between(
      [message.to, minTimestamp],
      [message.to, maxTimestamp],
      { index: 'toAndTimestamp' }
    )
    .orderBy({ index: r.desc('toAndTimestamp') })
    .filter(r.row('id').ne(message.id))
    .limit(limit)
    .orderBy(r.asc('timestamp'))
  )
}

const getMessagesAfter = async (message, limit) => {
  const minTimestamp = message.timestamp
  const maxTimestamp = r.maxval

  return await (
    r.table('messages')
    .between(
      [message.to, minTimestamp],
      [message.to, maxTimestamp],
      { index: 'toAndTimestamp' }
    )
    .orderBy({ index: 'toAndTimestamp' })
    .filter(r.row('id').ne(message.id))
    .limit(limit)
  )
}

const getMessagesAround = async (message, limit) => {
  const beforeLimit = Math.floor(limit / 2)
  const afterLimit = limit - 1 - beforeLimit

  const messagesBefore = await getMessagesBefore(message, beforeLimit)
  const messagesAfter = await getMessagesAfter(message, afterLimit)

  return fp.reduce(fp.concat, [], [messagesBefore, [message], messagesAfter])
}

const getMessagesByIds = async (messageIds) => {
  return await (
    r.table('messages')
    .getAll(r.args(messageIds))
    .orderBy(r.asc('timestamp'))
  )
}

const getMessage = async (messageId) => {
  return await (
    r.table('messages').get(messageId)
  )
}

const queries = fp.mapValues(retry, {
  createChannel,
  joinChannel,
  leaveChannel,
  leaveNetwork,
  updateNick,
  updateUsers,
  updateUser,
  updateTopic,
  saveMessage,
  getChannels,
  getUsers,
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
  getMessagesByIds,
  getMessage,
})

module.exports = queries
