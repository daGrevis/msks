const shouldNotify = (connection, channel, messageNick, messageText) => {
  const { nick } = connection

  if (channel.type === 'user') {
    if (messageNick !== nick) {
      return true
    }
  }

  if (channel.type === 'shared') {
    // Didn't want to mess with regexp escaping.
    const index = messageText.indexOf(nick)
    const lastIndex = index === -1 ? null : index + nick.length
    if (
      messageNick !== nick &&
      index !== -1 &&
      (index === 0 || messageText[index - 1] === ' ') &&
      (lastIndex === messageText.length ||
        messageText[lastIndex] === ' ' ||
        messageText[lastIndex] === ',' ||
        messageText[lastIndex] === ':')
    ) {
      return true
    }
  }

  return false
}

module.exports = shouldNotify
