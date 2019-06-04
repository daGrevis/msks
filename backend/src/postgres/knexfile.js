const config = require('../env/config')

const { host, user, password, database } = config.postgres

module.exports = {
  client: 'pg',
  connection: {
    host,
    user,
    password,
    database,
  },
}
