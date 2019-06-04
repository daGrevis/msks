const say = require('../say')
const store = require('../../store')
const humanizeDelta = require('../../utils/humanizeDelta')

const uptime = async ({ ircClient, channelName }) => {
  const state = store.getState()

  const response = humanizeDelta(new Date() - state.processUptime)

  say(ircClient, {
    target: channelName,
    message: response,
  })
}

module.exports = uptime
