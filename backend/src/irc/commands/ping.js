const say = require('../say')

const ping = async ({ ircClient, channelName }) => {
  const response = 'pong'

  say(ircClient, {
    target: channelName,
    message: response,
  })
}

module.exports = ping
