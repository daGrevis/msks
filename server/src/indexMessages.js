global.Promise = require('bluebird')
const _ = require('lodash')
const ProgressBar = require('progress')

const r = require('./rethink')
const { indexMessages } = require('./elastic/queries')

const BULK_SIZE = 1000

const run = async () => {
  const count = await r.table('messages').count()

  const bar = new ProgressBar(':percent [:bar] :etas', { total: count })

  let lastTimestamp = r.minval
  let lastId = null
  let index = 0
  while (true) {
    let rq = (
      r.table('messages')
      .between(lastTimestamp, r.maxval, { index: 'timestamp' })
      .orderBy({ index: r.asc('timestamp') })
      .filter(message =>
        r.expr(['message', 'notice', 'action']).contains(message('kind')))
    )

    if (lastId) {
      rq = rq.filter(r.row('id').ne(lastId))
    }

    let messages = await rq.limit(BULK_SIZE).run()

    if (!messages.length) {
      break
    }

    const lastMessage = _.last(messages)
    lastTimestamp = lastMessage.timestamp
    lastId = lastMessage.id

    await indexMessages(messages)
    for (const message of messages) {
      bar.tick()
    }
  }
}

run().then(() => process.exit(0))
