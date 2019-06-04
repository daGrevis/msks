const fp = require('lodash/fp')

const { createAccountConnectionsSelector } = require('./connections')

const publicChannelsSelector = state =>
  fp.pipe(
    fp.filter({ isPublic: true }),
    fp.map(channel => ({
      ...channel,
      isJoined: !!state.isJoinedIrcChannel[channel.id],
    })),
    fp.keyBy('id'),
  )(state.channels)

const createAccountChannelsSelector = accountId => state => {
  const accountConnections = createAccountConnectionsSelector(accountId)(state)
  const connectionIds = fp.map('id', accountConnections)

  return fp.pipe(
    fp.filter(channel => fp.includes(channel.connectionId, connectionIds)),
    fp.map(channel => ({
      ...channel,
      isJoined: !!state.isJoinedIrcChannel[channel.id],
      unread: state.unread[channel.id] || 0,
    })),
    fp.keyBy('id'),
  )(state.channels)
}

const createPublicChannelSelector = privateChannel => state => {
  const { serverId } = state.connections[privateChannel.connectionId]

  return fp.find(
    ({ isPublic, name, connectionId }) =>
      isPublic &&
      name === privateChannel.name &&
      serverId === state.connections[connectionId].serverId,
    state.channels,
  )
}

const createPrivateChannelsSelector = publicChannel => state => {
  const { serverId } = state.connections[publicChannel.connectionId]

  return fp.filter(
    ({ isPublic, name, connectionId }) =>
      !isPublic &&
      name === publicChannel.name &&
      state.connections[connectionId].serverId === serverId,
    state.channels,
  )
}

module.exports = {
  publicChannelsSelector,
  createAccountChannelsSelector,
  createPublicChannelSelector,
  createPrivateChannelsSelector,
}
