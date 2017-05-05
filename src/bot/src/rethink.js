const Promise = require('bluebird')
const _ = require('lodash')
const rethinkdb = require('rethinkdbdash')

const config = require('./config')

const r = rethinkdb({ host: config.rethinkHost, silent: true })

const queries = [
  r.tableCreate('channels', { primaryKey: 'name' }),

  r.tableCreate('users', { durability: 'soft' }),
  r.table('users').indexCreate('channel'),
  r.table('users').indexCreate('nick'),

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
