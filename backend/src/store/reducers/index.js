const { concat } = require('redux-fp')

const syncPostgres = require('./syncPostgres')
const irc = require('./irc')
const socket = require('./socket')
const subscriptions = require('./subscriptions')
const rateLimits = require('./rateLimits')

const rootReducer = (state, action) =>
  concat(syncPostgres, irc, socket, subscriptions, rateLimits)(action)(state)

module.exports = { rootReducer }
