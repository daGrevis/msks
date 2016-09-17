const Promise = require('bluebird')
const _ = require('lodash')
const rethinkdb = require('rethinkdbdash')

const db = rethinkdb({ silent: true })

const queries = [
  db.tableCreate('messages'),
  db.table('messages').indexCreate('timestamp'),
]

// Run queries in sequence, but never fail.
Promise.each(
  _.map(queries, q => q.run().catch(_.noop)),
  _.noop
)

module.exports = db
