const Promise = require('bluebird')
const _ = require('lodash')

const r = require('./')
const migrations = require('./migrations')
const logger = require('../logger')

const SLEEP_INTERVAL = 5 * 1000

const waitForRethink = () => new Promise((resolve) => {
  const tryPinging = (skipTimeout = false) => {
    setTimeout(() => {
      logger.verbose('Pinging RethinkDB...')

      r.expr(1)
        .then(() => {
          logger.verbose('Pong from RethinkDB!')

          resolve()
        })
        .catch(() => tryPinging(false))
    }, skipTimeout ? 0 : SLEEP_INTERVAL)
  }

  tryPinging(true)
})

const runMigrations = async () => {
  // Run migrations in sequence or silently fail when they're applied already.
  await Promise.all(_.map(migrations, fn =>
    fn.run().catch(_.noop)
  ))
}

module.exports = () => waitForRethink().then(runMigrations)
