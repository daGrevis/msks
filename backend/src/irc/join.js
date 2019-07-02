const store = require('../store')

const join = (connection, channelNames) => {
  const state = store.getState()

  const ircClient = state.ircClients[connection.id]

  const line = `JOIN ${channelNames.join(',')}`

  ircClient.raw(line)
}

module.exports = join
