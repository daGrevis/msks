global.Promise = require('bluebird')

const _ = require('lodash')
const chalk = require('chalk')

Promise.config({
  longStackTraces: true,
  cancellation: true,
})

process.on('unhandledRejection', reason => {
  console.error(chalk.red(reason.stack || reason))
})

const config = require('./env/config')
const logger = require('./env/logger')
const pollUntil = require('./utils/pollUntil')
const waitForPostgres = require('./postgres/waitForPostgres')
const waitForElastic = require('./elastic/waitForElastic')
const server = require('./server')
const {
  initChannels,
  initConnections,
  initUsers,
} = require('./irc/syncPostgres')
const eventQueue = require('./irc/eventQueue')
const connect = require('./irc/connect')
const store = require('./store')
const { autoConnectionsSelector } = require('./store/selectors/connections')

Promise.all([waitForPostgres(), waitForElastic()]).then(async () => {
  logger.verbose(`Config loaded! ${JSON.stringify(config, null, 2)}`)

  await Promise.all([initChannels(), initConnections(), initUsers()])

  server.listen(config.http.port)
  logger.info(`Listening on port ${config.http.port}...`)

  const state = store.getState()

  const autoConnections = autoConnectionsSelector(state)

  _.forEach(autoConnections, connection => {
    connect(connection)
  })
})

process.on('SIGTERM', async () => {
  logger.info(`Received SIGTERM, quitting connections...`)

  const state = store.getState()

  _.forEach(state.ircClients, ircClient => {
    ircClient.quit()
  })

  await pollUntil(async () => {
    const state = store.getState()

    const isQueueEmpty =
      eventQueue.getQueueLength() === 0 && eventQueue.getPendingLength() === 0

    const didEveryoneQuit = _.every(
      state.ircClients,
      (ircClient, connectionId) => !state.isIrcClientConnected[connectionId],
    )

    if (!isQueueEmpty || !didEveryoneQuit) {
      throw Error('Not quiting just yet!')
    }
  })

  // Wait a second more just in case.
  setTimeout(() => {
    logger.info(`Connections quit, exiting...`)
    process.exit()
  }, 1000)
})
