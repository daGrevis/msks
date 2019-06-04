const elasticsearch = require('elasticsearch')

const config = require('../env/config')

const elastic = new elasticsearch.Client({
  log: [],
  host: config.elastic.host,
  httpAuth: config.elastic.httpAuth,
  maxRetries: 9000,
  deadTimeout: 5 * 1000,
})

module.exports = elastic
