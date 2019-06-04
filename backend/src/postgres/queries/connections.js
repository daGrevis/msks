const postgres = require('..')

const updateConnection = async (params, data) => {
  const connections = await postgres('connections')
    .where(params)
    .update(data)
    .limit(1)
    .returning('*')
  return connections[0]
}

const getConnection = async connectionId =>
  postgres('connections')
    .where({ id: connectionId })
    .first()

const getConnections = async () => postgres('connections')

module.exports = {
  updateConnection,
  getConnection,
  getConnections,
}
