const Promise = require('bluebird')
const _ = require('lodash')
const rethinkdb = require('rethinkdbdash')

const db = rethinkdb({ silent: true })

const queries = [
  db.tableCreate('channels', { primaryKey: 'name' }),

  db.tableCreate('active_users'),
  db.table('active_users').indexCreate('username'),
  db.table('active_users').indexCreate('channel'),

  db.tableCreate('messages'),
  db.table('messages').indexCreate('from'),
  db.table('messages').indexCreate('timestamp'),
]

// Run queries in sequence, but never fail.
Promise.each(
  _.map(queries, q => q.run().catch(_.noop)),
  _.noop
)

module.exports = db
