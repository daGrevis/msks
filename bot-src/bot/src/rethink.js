const Promise = require('bluebird')
const _ = require('lodash')
const rethinkdb = require('rethinkdbdash')

const r = rethinkdb({ silent: true })

const queries = [
  r.tableCreate('channels', { primaryKey: 'name' }),

  r.tableCreate('active_users'),
  r.table('active_users').indexCreate('nick'),
  r.table('active_users').indexCreate('channel'),

  r.tableCreate('messages'),
  r.table('messages').indexCreate('to'),
  r.table('messages').indexCreate('timestamp'),
  r.table('messages').indexCreate('toAndTimestamp', [r.row('to'), r.row('timestamp')])
]

// Run queries in sequence, but never fail.
Promise.each(
  _.map(queries, q => q.run().catch(_.noop)),
  _.noop
)

module.exports = r
