const ircFramework = require('irc-framework')

const store = require('../store')
const attachEvents = require('./attachEvents')

const connect = connection => {
  const state = store.getState()

  let ircClient = state.ircClients[connection.id]

  if (!ircClient) {
    ircClient = new ircFramework.Client({
      nick: connection.nick,
      host: connection.host,
      port: connection.port,
      tls: connection.tls,
      username: connection.username || connection.nick,
      password: connection.password,
      // "Not enough parameters" with empty gecos so a space is used.
      gecos: connection.gecos || ' ',
      // Custom auto reconnect mechanism is implemented, see events/connection.js.
      auto_reconnect: false,
    })

    attachEvents(ircClient, connection.id)

    store.dispatch({
      type: 'SET_IRC_CLIENT',
      payload: {
        connectionId: connection.id,
        ircClient,
      },
    })
  }

  ircClient.connect()
}

module.exports = connect
