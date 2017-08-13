const elastic = require('./index')
const { runMappings } = require('./mappings')

const waitForElastic = (sleepInterval = 5 * 1000) => new Promise((resolve) => {
  const tryPinging = (skipTimeout = false) => {
    setTimeout(() => {
      elastic.ping(true, error => {
        if (error) {
          return tryPinging()
        }

        runMappings().then(resolve)
      })
    }, skipTimeout ? 0 : sleepInterval)
  }

  tryPinging(true)
})

module.exports = waitForElastic
