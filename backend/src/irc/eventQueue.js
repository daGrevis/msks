const Queue = require('promise-queue')

const config = require('../env/config')
const logger = require('../env/logger')

const eventQueue = new Queue(1, Infinity)

setInterval(() => {
  const queueLength = eventQueue.getQueueLength()

  if (queueLength >= config.logger.minEventsInQueue) {
    logger.debug(`[queue] ${queueLength} pending`)
  }
}, config.logger.queueInterval)

module.exports = eventQueue
