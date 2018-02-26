const fp = require('lodash/fp')

const elastic = require('./index')

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

const searchMessages = async (channel, query, limit, afterTimestamp) => {
  const { text, nick } = query

  const isPhraseSearch = fp.some(delimeter => (
    fp.startsWith(delimeter, text) && fp.endsWith(delimeter, text)
  ), ['"', '\''])
  const phraseText = isPhraseSearch ? text.slice(1, -1) : null

  let body = {
    size: limit,
    sort: [{ timestamp: { order: 'desc' }}],
    query: {
      bool: {
        filter: fp.concat(
          { term: { to: channel }},
          !nick ? [] : { term: { from: nick }}
        ),
        must: !text ? [] : [
          isPhraseSearch
          ? {
            match_phrase: {
              text: phraseText,
            },
          }
          : {
            match: {
              text: {
                query: text,
                operator: 'and',
                fuzziness: 'auto',
              },
            },
          },
        ],
      },
    },
    highlight: {
      pre_tags: ['<highlight>'],
      post_tags: ['</highlight>'],
      fields: { text: {}},
    },
  }

  if (afterTimestamp) {
    body.search_after = [+afterTimestamp]
  }

  const { hits } = await elastic.search({
    index: 'messages',
    type: 'message',
    body,
  })

  return hits
}

module.exports = { indexMessage, indexMessages, searchMessages }
