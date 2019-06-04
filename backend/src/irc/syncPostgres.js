const fp = require('lodash/fp')

const store = require('../store')
const { getChannels } = require('../postgres/queries/channels')
const { getConnections } = require('../postgres/queries/connections')
const { getUsers } = require('../postgres/queries/users')

const initChannels = async () => {
  const channels = await getChannels()

  store.dispatch({
    type: 'SYNC_POSTGRES',
    payload: {
      table: 'channels',
      changes: fp.map(channel => ({ next: channel }), channels),
    },
  })
}

const initConnections = async () => {
  const connections = await getConnections()

  store.dispatch({
    type: 'SYNC_POSTGRES',
    payload: {
      table: 'connections',
      changes: fp.map(connection => ({ next: connection }), connections),
    },
  })
}

const initUsers = async () => {
  const users = await getUsers()

  store.dispatch({
    type: 'SYNC_POSTGRES',
    payload: {
      table: 'users',
      changes: fp.map(user => ({ next: user }), users),
    },
  })
}

module.exports = {
  initChannels,
  initConnections,
  initUsers,
}
