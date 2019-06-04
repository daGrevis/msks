const fp = require('lodash/fp')
const { handleActions } = require('redux-fp')

module.exports = handleActions({
  SET_RATE_LIMIT: ({ payload: { connection, nick, allowance, timestamp } }) =>
    fp.set(['rateLimits', connection.id, nick], { allowance, timestamp }),
})
