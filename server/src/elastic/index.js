const elasticsearch = require('elasticsearch')

const config = require('../config')

const elastic = new elasticsearch.Client({
  log: config.elastic.debug ? 'trace' : 'error',
  host: config.elastic.host,
  httpAuth: config.elastic.httpAuth,
  maxRetries: 9000,
  deadTimeout: 5 * 1000,
})

module.exports = elastic
