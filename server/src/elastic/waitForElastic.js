const elastic = require('./index')
const { runMappings } = require('./mappings')
const logger = require('../logger')

const SLEEP_INTERVAL = 5 * 1000

const waitForElastic = () => new Promise((resolve) => {
  const tryPinging = (skipTimeout = false) => {
    setTimeout(() => {
      logger.verbose('Pinging Elastic...')

      elastic.ping(true, error => {
        if (error) {
          return tryPinging()
        }

        logger.verbose('Pong from Elastic!')

        resolve()
      })
    }, skipTimeout ? 0 : SLEEP_INTERVAL)
  }

  tryPinging(true)
})

module.exports = () => waitForElastic().then(runMappings)
