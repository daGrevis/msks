const rethinkdb = require('rethinkdbdash')

const config = require('../config')

const r = rethinkdb({
  host: config.rethink.host,
  silent: !config.rethink.debug,
})

module.exports = r
