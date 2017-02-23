const Promise = require('bluebird')
const _ = require('lodash')
const fp = require('lodash/fp')

const r = require('./rethink')
const retry = require('./retry')

const createChannel = channel =>
  // Creates the channel or silently fails when it exists already.
  r.table('channels').insert(channel).run()
    .catch(_.noop)

const joinChannel = activeUser =>
  r.table('active_users').insert(activeUser).run()

const leaveChannel = activeUser =>
  r.table('active_users').filter(activeUser).delete().run()

const leaveNetwork = nick =>
  r.table('active_users').filter({ nick }).delete().run()

const updateNick = (nick, newNick) => new Promise((resolve, reject) => {
  // Done like this to avoid the need of handling updates when listening to changefeed.
  r.table('active_users').filter({ nick }).delete({ returnChanges: true }).run()
    .catch(reject)
    .then(({ changes }) => {
      const activeUsers = _.map(changes, ({ old_val }) => ({
        channel: old_val.channel,
        nick: newNick,
      }))
      r.table('active_users').insert(activeUsers).run()
        .catch(reject)
        .then(resolve)
    })
})

const updateChannelActiveUsers = (channel, activeUsers) => new Promise((resolve, reject) => {
  // TODO: I'm pretty here's a race condition with parallel joins/leaves.
  r.table('active_users').filter({ channel }).delete().run()
    .catch(reject)
    .then(() => {
      r.table('active_users').insert(activeUsers).run()
        .catch(reject)
        .then(resolve)
    })
})

const updateTopic = (channel, topic) =>
  // TODO: Race condition when this runs before channel exists.
  r.table('channels').get(channel).update({ topic }).run()

const saveMessage = message =>
  r.table('messages').insert(message).run()

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
