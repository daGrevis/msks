const rethinkdb = require('rethinkdbdash')

const host = process.env.RETHINK_HOST || 'localhost'

const r = rethinkdb({ host, silent: false })

module.exports = r
