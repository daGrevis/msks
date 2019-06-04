const postgres = require('.')
const logger = require('../env/logger')
const pollUntil = require('../utils/pollUntil')

const waitForPostgres = () =>
  pollUntil(async () => {
    logger.verbose('Checking Postgres...')

    try {
      await postgres.raw('SELECT * FROM "knex_migrations"')
    } catch (e) {
      logger.verbose(`Postgres is not ready, will retry: '${e.message}'`)

      throw e
    }

    logger.verbose('Postgres ready!')
  }, 5000)

module.exports = waitForPostgres
