const fp = require('lodash/fp')

const publicConnectionsSelector = state =>
  fp.reduce(
    (a, { connectionId }) =>
      a[connectionId]
        ? a
        : fp.set(
            connectionId,
            fp.pick(
              ['id', 'createdAt', 'serverId', 'nick'],
              state.connections[connectionId],
            ),
            a,
          ),
    {},
    fp.filter({ isPublic: true }, state.channels),
  )

const createAccountConnectionsSelector = accountId => state =>
  fp.pipe(
    fp.filter({ accountId }),
    fp.map(connection => ({
      ...connection,
      isConnected: !!state.isIrcClientConnected[connection.id],
    })),
    fp.keyBy('id'),
  )(state.connections)

module.exports = { publicConnectionsSelector, createAccountConnectionsSelector }
