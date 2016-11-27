const rethinkdb = require('rethinkdbdash')

const r = rethinkdb({ silent: true })

module.exports = r
