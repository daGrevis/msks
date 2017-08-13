const fp = require('lodash/fp')

const elastic = require('./index')
const { getMessagesByIds } = require('../rethink/queries')

const toBody = message =>
  fp.pick([
    'timestamp',
    'from',
    'to',
    'text',
  ], message)

const indexMessage = message => {
  return elastic.index({
    index: 'messages',
    type: 'message',
    id: message.id,
    body: toBody(message),
  })
}

const indexMessages = messages => {
  return elastic.bulk({
    body: fp.flatMap(message => [
      { index: { _index: 'messages', _type: 'message', _id: message.id }},
      toBody(message),
    ], messages),
  })
}

const searchMessages = async (channel, query, offset = 0) => {
  const limit = 50

  query = fp.omit(['channel', 'offset'], query)

  if (!channel) {
    return {
      error: 'SEARCH_MESSAGES: channel missing!',
    }
  }

  const { hits: results } = await elastic.search({
    index: 'messages',
    type: 'message',
    body: {
      query: {
        bool: {
          filter: fp.concat(
            { term: { to: channel }},
            !query.nick ? [] : { term: { from: query.nick }}
          ),
          must: !query.text ? [] : [{
            match: { text: query.text },
          }],
        },
      },
      sort: [
        { timestamp: { order: 'desc' }},
      ],
      size: limit,
      from: offset,
    },
  })

  return {
    messages: await getMessagesByIds(fp.map('_id', results.hits)),
    channel,
    query,
    offset,
    limit,
  }
}

module.exports = { indexMessage, indexMessages, searchMessages }
