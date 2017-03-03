const Promise = require('bluebird')
const _ = require('lodash')
const fp = require('lodash/fp')

const r = require('./rethink')
const { validate } = require('./schemas')
const schemas = require('./schemas')
const retry = require('./retry')

const createChannel = async function(channel) {
  await validate(channel, schemas.Channel)
  // Creates the channel or silently fails when it exists already.
  await r.table('channels').insert(channel).run().catch(_.noop)
}

const joinChannel = async function(user) {
  await validate(user, schemas.User)
  await r.table('users').insert(user, { conflict: 'replace' }).run()
}

const leaveChannel = async function(channel, nick) {
  await r.table('users').get([channel, nick]).delete().run()
}

const leaveNetwork = async function(nick) {
  await r.table('users').getAll(nick, { index: 'nick' }).delete().run()
}

const updateNick = async function(nick, newNick) {
  const { changes } = await r.table('users').getAll(nick, { index: 'nick' })
    .delete({ returnChanges: true }).run()

  const users = _.map(changes, ({ old_val }) => ({
    id: [old_val.channel, newNick],
    channel: old_val.channel,
    nick: newNick,
  }))
  await Promise.all(_.map(users, user => validate(user, schemas.User)))

  await r.table('users').insert(users, { conflict: 'replace' }).run()
}

const updateUsers = async function(channel, users) {
  await Promise.all(_.map(users, user => validate(user, schemas.User)))

  await r.table('users').getAll(channel, { index: 'channel' }).delete().run()
  await r.table('users').insert(users, { conflict: 'replace' }).run()
}

const updateUser = async function(user) {
  await validate(user, schemas.User)
  await r.table('users').get(user.id).update(user).run()
}

const updateTopic = async function(channel, topic) {
  // TODO: Race condition when this runs before channel exists.
  await r.table('channels').get(channel).update({ topic }).run()
}

const saveMessage = async function(message) {
  await validate(message, schemas.Message)
  await r.table('messages').insert(message).run()
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
})

module.exports = queries
