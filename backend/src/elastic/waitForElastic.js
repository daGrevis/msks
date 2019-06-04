const elastic = require('./index')
const logger = require('../env/logger')
const pollUntil = require('../utils/pollUntil')

const waitForElastic = () =>
  pollUntil(async () => {
    logger.verbose('Checking Elastic...')

    try {
      await elastic.ping()
    } catch (e) {
      logger.verbose(`Elastic is not ready, will retry: '${e.message}'`)

      throw e
    }

    logger.verbose('Elastic ready!')
  }, 5000)

module.exports = waitForElastic
