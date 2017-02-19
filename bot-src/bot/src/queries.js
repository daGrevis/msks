const _ = require('lodash')

const r = require('./rethink')

function createChannel(channel) {
  // This creates the channel or silently fails when it exists already.
  r.table('channels').insert(channel).run()
    .catch(_.noop)
}

function joinChannel(activeUser) {
  r.table('active_users').insert(activeUser).run()
}

function leaveChannel(activeUser) {
  r.table('active_users').filter(activeUser).delete().run()
}

function leaveNetwork(nick) {
  r.table('active_users').filter({ nick }).delete().run()
}

function updateNick(nick, newNick) {
  // Done like this to avoid need of handling updates when listening to changefeed.
  r.table('active_users').filter({ nick }).delete({ returnChanges: true }).run()
    .then(({ changes }) => {
      const channels = _.map(changes, 'old_val.channel')
      _.forEach(channels, channel => {
        joinChannel(newNick, channel)
      })
    })
}

function updateChannelActiveUsers(channel, activeUsers) {
  // TODO: I'm pretty here's a race condition with parallel joins/leaves.
  r.table('active_users').filter({ channel }).delete().run()
    .then(() => {
      r.table('active_users').insert(activeUsers).run()
    })
}

function updateTopic(channel, topic) {
  // TODO: Race condition when this runs before channel exists.
  r.table('channels').get(channel).update({ topic }).run()
}

function saveMessage(message, i = 1) {
  r.table('messages').insert(message).run()
    .catch(err => {
      console.error(err)

      const delay = 1000 * i

      console.log(`retrying to save message ${JSON.stringify(message)} in ${delay} ms`)
      setTimeout(
        () => saveMessage(message, i + 1),
        delay
      )
    })
}

module.exports = {
  createChannel,
  joinChannel,
  leaveChannel,
  leaveNetwork,
  updateNick,
  updateChannelActiveUsers,
  updateTopic,
  saveMessage,
}
