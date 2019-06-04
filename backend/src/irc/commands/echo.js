const say = require('../say')

const echo = async ({ ircClient, channelName, params }) => {
  const response = params

  say(ircClient, {
    target: channelName,
    message: response,
  })
}

module.exports = echo
