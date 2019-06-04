const Queue = require('promise-queue')

const eventQueue = new Queue(1, Infinity)

module.exports = eventQueue
