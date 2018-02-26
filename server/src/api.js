const fp = require('lodash/fp')

const rethinkQueries = require('./rethink/queries')
const elasticQueries = require('./elastic/queries')

const getChannels = async () => {
  return {
    channels: await rethinkQueries.getChannels(),
  }
}

const getUsers = async (channel, nick) => {
  if (!channel) {
    return { error: 'GET_USERS: channel missing!' }
  }

  return {
    users: await rethinkQueries.getUsers(channel, nick),
    channel,
    nick,
  }
}

const getMessage = async (messageId) => {
  if (!messageId) {
    return { error: 'GET_MESSAGE: messageId missing!' }
  }

  return {
    message: await rethinkQueries.getMessage(messageId),
    messageId,
  }
}

const getMessages = async (channel, limit) => {
  if (!channel) {
    return { error: 'GET_MESSAGES: channel missing!' }
  }

  limit = +limit
  if (!limit) {
    return { error: 'GET_MESSAGES: limit missing!' }
  }
  if (limit < 1 || limit > 1000) {
    return { error: 'GET_MESSAGES: min limit is 1, max limit is 1000!' }
  }

  return {
    messages: await rethinkQueries.getMessages(channel, limit),
    channel,
    limit,
  }
}

const getMessagesBefore = async (messageId, limit) => {
  if (!messageId) {
    return { error: 'GET_MESSAGES_BEFORE: messageId missing!' }
  }

  limit = +limit
  if (!limit) {
    return { error: 'GET_MESSAGES_BEFORE: limit missing!' }
  }
  if (limit < 1 || limit > 1000) {
    return { error: 'GET_MESSAGES_BEFORE: min limit is 1, max limit is 1000!' }
  }

  const message = await rethinkQueries.getMessage(messageId)

  if (!message) {
    return { error: 'GET_MESSAGES_BEFORE: invalid messageId!' }
  }

  return {
    messages: await rethinkQueries.getMessagesBefore(message, limit),
    channel: message.to,
    messageId,
    limit,
  }
}

const getMessagesAfter = async (messageId, limit) => {
  if (!messageId) {
    return { error: 'GET_MESSAGES_AFTER: messageId missing!' }
  }

  limit = +limit
  if (!limit) {
    return { error: 'GET_MESSAGES_AFTER: limit missing!' }
  }
  if (limit < 1 || limit > 1000) {
    return { error: 'GET_MESSAGES_AFTER: min limit is 1, max limit is 1000!' }
  }

  const message = await rethinkQueries.getMessage(messageId)

  if (!message) {
    return { error: 'GET_MESSAGES_AFTER: invalid messageId!' }
  }

  return {
    messages: await rethinkQueries.getMessagesAfter(message, limit),
    channel: message.to,
    messageId,
    limit,
  }
}

const getMessagesAround = async (messageId, limit) => {
  if (!messageId) {
    return { error: 'GET_MESSAGES_AROUND: messageId missing!' }
  }

  limit = +limit
  if (!limit) {
    return { error: 'GET_MESSAGES_AROUND: limit missing!' }
  }
  if (limit < 1 || limit > 1000) {
    return { error: 'GET_MESSAGES_AROUND: min limit is 1, max limit is 1000!' }
  }

  const message = await rethinkQueries.getMessage(messageId)

  if (!message) {
    return { error: 'GET_MESSAGES_AROUND: invalid messageId!' }
  }

  return {
    messages: await rethinkQueries.getMessagesAround(message, limit),
    channel: message.to,
    messageId,
    limit,
  }
}

const searchMessages = async (channel, query, limit, messageId) => {
  if (!channel) {
    return {
      error: 'SEARCH_MESSAGES: channel missing!',
    }
  }

  limit = +limit
  if (!limit) {
    return { error: 'SEARCH_MESSAGES: limit missing!' }
  }
  if (limit < 1 || limit > 500) {
    return { error: 'SEARCH_MESSAGES: min limit is 1, max limit is 500!' }
  }

  let afterTimestamp
  if (messageId) {
    const message = await rethinkQueries.getMessage(messageId)

    if (!message) {
      return { error: 'SEARCH_MESSAGES: invalid messageId!' }
    }

    afterTimestamp = message.timestamp
  }

  const results = await elasticQueries.searchMessages(channel, query, limit, afterTimestamp)

  let messages = await rethinkQueries.getMessagesByIds(fp.map('_id', results.hits))
  messages = fp.map(message => {
    const hit = fp.find({ _id: message.id }, results.hits)
    return {
      ...message,
      highlights: hit.highlight ? hit.highlight.text[0] : undefined,
    }
  }, messages)

  return {
    messages,
    channel,
    query,
    limit,
    messageId,
  }
}

module.exports = {
  getChannels,
  getUsers,
  getMessage,
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
  searchMessages,
}
