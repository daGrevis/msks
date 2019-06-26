const util = require('util')

const config = require('../../env/config')
const logger = require('../../env/logger')

const withLogger = () => next => action => {
  const startTime = new Date()

  const result = next(action)

  const duration = new Date() - startTime

  if (duration >= config.logger.minReduxReducerDuration) {
    const { type, payload } = action

    let prettyPayload = ''

    if (payload) {
      prettyPayload = ` ${util.inspect(payload, {
        depth: 1,
        maxArrayLength: 3,
      })}`
    }

    logger.debug(`[redux ${duration}ms] ${type}${prettyPayload}`)
  }

  return result
}

module.exports = withLogger
