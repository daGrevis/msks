const say = (ircClient, payload) => {
  if (payload.type === 'notice') {
    ircClient.notice(payload.target, payload.message)
  } else if (payload.type === 'action') {
    ircClient.action(payload.target, payload.message)
  } else {
    ircClient.say(payload.target, payload.message)
  }

  const ircUser = ircClient.user

  if (payload.target !== ircUser.nick) {
    // Server won't emit onMessage event for your own messages sent to others.
    ircClient.emit('message', {
      type: payload.type || 'privmsg',
      tags: {},
      nick: ircUser.nick,
      ident: `~${ircUser.username}`,
      // TODO: It's possible for user.host to be an empty string. Get host from onJoin event.
      hostname: ircUser.host,
      target: payload.target,
      message: payload.message,
      reply: () => {
        throw Error('Not implemented!')
      },
    })
  }
}

module.exports = say
