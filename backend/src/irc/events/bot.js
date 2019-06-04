const fp = require('lodash/fp')

const config = require('../../env/config')
const store = require('../../store')
const { getCommand } = require('../commands')
const say = require('../say')

const onMessage = async ({ payload, ircClient, connection }) => {
  if (!connection.isBot) {
    return
  }

  const NOW = new Date()

  const state = store.getState()

  const channelName =
    payload.target === connection.nick ? payload.nick : payload.target

  const channel = fp.find(
    {
      name: channelName,
      connectionId: connection.id,
    },
    state.channels,
  )

  if (channel.isBotSilent) {
    return
  }

  // Don't run your own command to avoid "!echo !echo !echo" and such.
  if (payload.nick === connection.nick) {
    return
  }

  const { command, commandParams } = getCommand(connection, payload)

  if (!command) {
    return
  }

  const prevLimit = fp.get([connection.id, payload.nick], state.rateLimits) || {
    allowance: config.irc.botRateLimitAllowance,
    timestamp: NOW,
  }

  let nextAllowance = prevLimit.allowance

  nextAllowance +=
    (NOW - prevLimit.timestamp) *
    (config.irc.botRateLimitAllowance / config.irc.botRateLimitDuration)

  // Cap allowance so it doesn't just grow.
  if (nextAllowance > config.irc.botRateLimitAllowance) {
    nextAllowance = config.irc.botRateLimitAllowance
  }

  nextAllowance -= 1

  store.dispatch({
    type: 'SET_RATE_LIMIT',
    payload: {
      connection,
      nick: payload.nick,
      allowance: nextAllowance,
      timestamp: NOW,
    },
  })

  const isRateLimited = nextAllowance < 0
  const hasBeenRateLimited = prevLimit.allowance < 0

  if (isRateLimited) {
    if (!hasBeenRateLimited) {
      const response = 'Command rate limit exceeded, stop the spam!'

      say(ircClient, {
        target: payload.nick,
        message: response,
      })
    }

    return
  }

  await command({
    params: commandParams,
    ircClient,
    channelName,
  })
}

const onKick = async ({ payload, ircClient, connection }) => {
  if (!connection.isBot) {
    return
  }

  ircClient.join(payload.channel)
}

module.exports = {
  onMessage,
  onKick,
}
