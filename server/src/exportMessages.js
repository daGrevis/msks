const fs = require('fs')

const _ = require('lodash')
const fp = require('lodash/fp')

const logger = require('./logger')
const r = require('./rethink')

const channelName = process.argv[2]

if (!channelName) {
  logger.error('Channel name is required!')
  process.exit(1)
}

const mapMessage = message => {
  let type = message.kind
  let text = message.text
  let meta

  if (type === 'message') {
    type = 'text'
  } else if (type === 'kick') {
    meta = {
      kicked: message.kicked,
    }
  } else if (type === 'nick') {
    meta = {
      newNick: message.newNick,
    }
  } else if (type === 'mode') {
    text = `${message.from} set ${message.text} on ${message.param}`
    meta = {
      mode: message.text,
      param: message.param,
    }
  }

  return fp.omitBy(fp.isUndefined, {
    id: message.id,
    createdAt: message.timestamp,
    nick: message.from,
    type: type || undefined,
    text: text || undefined,
    isOp: message.isOp || undefined,
    isVoiced: message.isVoiced || undefined,
    meta: meta || undefined,
  })
}

const run = () =>
  new Promise(async resolve => {
    const outputPath = `exports/export-${channelName.replace('#', '')}.json`

    logger.info(`Exporting ${channelName} to ${outputPath}...`)

    const writeStream = fs.createWriteStream(outputPath)

    writeStream.write('{"messages":[\n')

    let lastTimestamp = r.minval
    let lastId = null
    let messagesCounter = 0
    let isFirstRun = true
    while (true) {
      let query = r
        .table('messages')
        .between(lastTimestamp, r.maxval, { index: 'timestamp' })
        .orderBy({ index: r.asc('timestamp') })
        .filter({ to: channelName })

      if (lastId) {
        query = query.filter(r.row('id').ne(lastId))
      }

      const messages = await query.limit(1000).run()

      if (!messages.length) {
        break
      }

      messagesCounter += messages.length

      let content = JSON.stringify(fp.map(mapMessage, messages))
      content = content.slice(1, -1)
      content = isFirstRun ? content : `,\n${content}`

      writeStream.write(content)

      const lastMessage = _.last(messages)
      lastTimestamp = lastMessage.timestamp
      lastId = lastMessage.id

      isFirstRun = false
    }

    writeStream.write('\n]}')

    writeStream.end()

    writeStream.on('finish', () => {
      logger.info(
        `Successfully exported ${messagesCounter} message${
          messagesCounter !== 1 ? 's' : ''
        } to ${outputPath}!`,
      )

      resolve()
    })
  })

run().then(() => process.exit(0))
