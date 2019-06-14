const fp = require('lodash/fp')

const postgres = require('..')

const createMessage = async message => {
  await postgres('messages').insert(message)
  return message
}

const getMessage = async messageId =>
  postgres('messages')
    .where({ id: messageId })
    .first()

const PHRASE_SEARCH_DELIMETER_PAIRS = [
  ['"', '"'],
  ["'", "'"],
  ['“', '”'],
  ['‘', '’'],
]

const getMessagesQuery = query => {
  const { channelId, publicChannelId, text, nick } = query

  const postgresQuery = postgres('messages').select('*')

  postgresQuery.where(function() {
    this.where({ channelId })
    if (publicChannelId) {
      this.orWhere({ channelId: publicChannelId })
    }
  })

  const isPhraseSearch =
    text &&
    fp.some(
      ([startDelimeter, endDelimeter]) =>
        fp.startsWith(startDelimeter, text) && fp.endsWith(endDelimeter, text),
      PHRASE_SEARCH_DELIMETER_PAIRS,
    )

  const phraseText = isPhraseSearch ? text.slice(1, -1) : undefined

  const isSearch = (isPhraseSearch ? phraseText : text) || nick

  if (isSearch) {
    const filterBool = {}
    if (nick) {
      filterBool.must = { term: { nick } }
    } else {
      filterBool.must_not = [
        { term: { type: 'join' } },
        { term: { type: 'quit' } },
        { term: { type: 'part' } },
        { term: { type: 'nick' } },
        { term: { type: 'mode' } },
      ]
    }

    const elasticQuery = {
      bool: {
        filter: {
          bool: filterBool,
        },
        must: !text
          ? []
          : [
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
    }

    postgresQuery
      .whereRaw('"messages" ==> ?', [JSON.stringify(elasticQuery)])
      .select(
        postgres.raw(`
          (zdb.highlight(
            ctid,
            'text',
            zdb.highlight(
              pre_tags=>'{<highlight>}',
              post_tags=>'{</highlight>}',
              number_of_fragments=>0
            )
          ))[1] as highlights
        `),
      )
  }

  return postgresQuery
}

const getMessageCreatedAtQuery = messageId =>
  postgres
    .select('createdAt')
    .from('messages')
    .where({ id: messageId })
    .limit(1)

const getMessagesBeforeQuery = query =>
  postgres
    .select()
    .from(
      getMessagesQuery(query)
        .andWhere(function() {
          this.where('createdAt', '<', getMessageCreatedAtQuery(query.before))
          this.orWhere(function() {
            this.where('createdAt', '=', getMessageCreatedAtQuery(query.before))
            this.where('id', '>', query.before)
          })
        })
        .orderBy('createdAt', 'desc')
        .orderBy('id')
        .limit(query.limit)
        .as('messages'),
    )
    .orderBy('createdAt')
    .orderBy('id', 'desc')

const getMessagesAfterQuery = query =>
  getMessagesQuery(query)
    .andWhere(function() {
      this.where('createdAt', '>', getMessageCreatedAtQuery(query.after))
      this.orWhere(function() {
        this.where('createdAt', '=', getMessageCreatedAtQuery(query.after))
        this.where('id', '<', query.after)
      })
    })
    .orderBy('createdAt')
    .orderBy('id', 'desc')
    .limit(query.limit)

const getMessagesAroundQuery = query => {
  const halfLimit = Math.ceil(query.limit / 2)
  return postgres
    .select()
    .from(
      postgres
        .union(
          [
            getMessagesQuery(query)
              .andWhere(function() {
                this.where(
                  'createdAt',
                  '<',
                  getMessageCreatedAtQuery(query.around),
                )
                this.orWhere(function() {
                  this.where(
                    'createdAt',
                    '=',
                    getMessageCreatedAtQuery(query.around),
                  )
                  this.where('id', '>=', query.around)
                })
              })
              .orderBy('createdAt', 'desc')
              .orderBy('id')
              .limit(halfLimit),
            getMessagesQuery(query)
              .andWhere(function() {
                this.where(
                  'createdAt',
                  '>',
                  getMessageCreatedAtQuery(query.around),
                )
                this.orWhere(function() {
                  this.where(
                    'createdAt',
                    '=',
                    getMessageCreatedAtQuery(query.around),
                  )
                  this.where('id', '<', query.around)
                })
              })
              .orderBy('createdAt')
              .orderBy('id', 'desc')
              .limit(query.limit - halfLimit),
          ],
          true,
        )
        .as('messages'),
    )
    .orderBy('createdAt')
    .orderBy('id', 'desc')
}

const getLatestMessagesQuery = query =>
  postgres
    .select()
    .from(
      getMessagesQuery(query)
        .orderBy('createdAt', 'desc')
        .orderBy('id')
        .limit(query.limit)
        .as('messages'),
    )
    .orderBy('createdAt')
    .orderBy('id', 'desc')

const getOldestMessageQuery = query =>
  getMessagesQuery(query)
    .orderBy('createdAt')
    .orderBy('id', 'desc')
    .first()

const getMessages = async query => {
  let messages = []

  if (query.before) {
    messages = await getMessagesBeforeQuery(query)
  } else if (query.after) {
    messages = await getMessagesAfterQuery(query)
  } else if (query.around) {
    messages = await getMessagesAroundQuery(query)
  } else {
    messages = await getLatestMessagesQuery(query)
  }

  messages = fp.map(
    message =>
      fp.omitBy(fp.isUndefined, {
        channelId: query.channelId,
        id: message.id,
        createdAt: message.createdAt,
        nick: message.nick,
        type: message.type,
        text: message.text !== '' ? message.text : undefined,
        highlights: message.highlights ? message.highlights : undefined,
        isOp: message.isOp ? message.isOp : undefined,
        isVoiced: message.isVoiced ? message.isVoiced : undefined,
        meta: message.meta !== null ? message.meta : undefined,
      }),
    messages,
  )

  return messages
}

module.exports = {
  createMessage,
  getMessage,
  getMessages,
  getOldestMessageQuery,
  getMessagesBeforeQuery,
  getMessagesAfterQuery,
  getMessagesAroundQuery,
  getLatestMessagesQuery,
}
