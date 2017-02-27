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

const joinChannel = async function(activeUser) {
  await validate(activeUser, schemas.ActiveUser)
  await r.table('active_users').insert(activeUser).run()
}

const leaveChannel = async function(activeUser) {
  await validate(activeUser, schemas.ActiveUser)
  await r.table('active_users').filter(activeUser).delete().run()
}

const leaveNetwork = async function(nick) {
  await r.table('active_users').filter({ nick }).delete().run()
}

const updateNick = async function(nick, newNick) {
  const { changes } = await r.table('active_users')
    .filter({ nick }).delete({ returnChanges: true }).run()

  const activeUsers = _.map(changes, ({ old_val }) => ({
    channel: old_val.channel,
    nick: newNick,
  }))
  await r.table('active_users').insert(activeUsers).run()
}

const updateChannelActiveUsers = async function(channel, activeUsers) {
  await Promise.all(_.map(activeUsers, user => validate(user, schemas.ActiveUser)))
  await r.table('active_users').filter({ channel }).delete().run()
  await r.table('active_users').insert(activeUsers).run()
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
  updateChannelActiveUsers,
  updateTopic,
  saveMessage,
})

module.exports = queries
