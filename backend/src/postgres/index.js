const knex = require('knex')

const knexfile = require('./knexfile')
const config = require('../env/config')
const logger = require('../env/logger')

const postgres = knex(knexfile)

const queries = {}

postgres
  .on('query', data => {
    const { __knexQueryUid: queryId, sql, bindings, method } = data

    const startTime = new Date()

    queries[queryId] = { queryId, sql, bindings, startTime, method }
  })
  .on('query-response', (response, { __knexQueryUid: queryId }) => {
    const query = queries[queryId]
    const { sql, bindings, startTime, method } = query

    const duration = new Date() - startTime

    if (duration >= config.logger.minPostgresQueryDuration) {
      let prettySql
      if (method === 'insert') {
        prettySql = sql.match(/insert into ("\w+")/, '')[0]
      } else {
        prettySql = postgres.client._formatQuery(sql, bindings)
      }

      logger.debug(`[postgres ${duration}ms] ${prettySql}`)
    }

    delete queries[queryId]
  })
  .on('query-error', (error, { __knexQueryUid: queryId }) => {
    delete queries[queryId]
  })

module.exports = postgres
