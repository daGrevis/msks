const fs = require('fs')

const fp = require('lodash/fp')
const yargs = require('yargs')
const stringify = require('json-stable-stringify')

const logger = require('../env/logger')
const postgres = require('../postgres')
const {
  getOldestMessageQuery,
  getMessagesAfterQuery,
} = require('../postgres/queries/messages')
const { getConnection } = require('../postgres/queries/connections')
const isUuid = require('../utils/isUuid')

const { argv } = yargs
  .command('$0 <channel> [range]')
  .option('range', {
    string: true,
    default: undefined,
  })
  .option('output', {
    string: true,
    default: undefined,
  })
  .option('stepLimit', {
    number: true,
    default: 1000,
  })
  .version(false)
  .option('h', {
    alias: 'help',
  })

const getChannelQuery = arg => {
  if (isUuid(arg)) {
    return postgres('channels')
      .where({ id: arg })
      .first()
  }

  const [serverId, nick, channelName] = arg.split('/')

  return postgres('channels')
    .select('channels.*')
    .join('connections', { 'connections.id': 'channels.connectionId' })
    .where({
      'connections.serverId': serverId,
      'connections.nick': nick,
      'channels.name': channelName,
    })
    .first()
}

const getRangeStart = arg => {
  if (!arg) {
    return
  }

  const [startToken] = arg.split('/')
  const [startYear, startMonth, startDay] = startToken.split('-')

  const rangeStart = new Date(
    Date.UTC(
      startYear,
      startMonth ? Number(startMonth) - 1 : 0,
      startDay ? Number(startDay) : 1,
    ),
  )

  return rangeStart
}

const getRangeEnd = arg => {
  if (!arg) {
    return
  }

  const [startToken, endToken] = arg.split('/')
  const [endYear, endMonth, endDay] = (endToken || startToken).split('-')

  const rangeEnd = new Date(
    Date.UTC(
      endYear,
      endMonth ? Number(endMonth) - 1 : 11,
      endDay ? Number(endDay) : new Date(endYear, endMonth || 12, 0).getDate(),
      23,
      59,
      59,
      999,
    ),
  )

  return rangeEnd
}

const getRangeFilteredQuery = (rangeStart, rangeEnd, query) => {
  if (rangeStart && rangeEnd) {
    query
      .where('createdAt', '>=', rangeStart)
      .where('createdAt', '<=', rangeEnd)
  }

  return query
}

const mapMessage = message =>
  fp.omitBy(fp.isUndefined, {
    id: message.id,
    createdAt: message.createdAt,
    nick: message.nick,
    type: message.type,
    text: message.text !== '' ? message.text : undefined,
    isOp: message.isOp ? message.isOp : undefined,
    isVoiced: message.isVoiced ? message.isVoiced : undefined,
    meta: message.meta !== null ? message.meta : undefined,
  })

const cmpKeys = orderedKeys => (a, b) => {
  const aIndex = orderedKeys.findIndex(x => x === a.key)
  const bIndex = orderedKeys.findIndex(x => x === b.key)

  return aIndex > bIndex ? 1 : -1
}

const run = () =>
  new Promise(async resolve => {
    let messagesCounter = 0

    const channel = await getChannelQuery(argv.channel)

    if (!channel) {
      logger.error('No channel was found!')
      process.exit(1)
    }

    const connection = await getConnection(channel.connectionId)

    const rangeStart = getRangeStart(argv.range)
    const rangeEnd = getRangeEnd(argv.range)

    logger.info(
      `Exporting channel with ID ${channel.id}${
        rangeStart && rangeEnd
          ? ` between ${rangeStart.toISOString()} and ${rangeEnd.toISOString()}`
          : ''
      }...`,
    )

    const oldestMessage = await getRangeFilteredQuery(
      rangeStart,
      rangeEnd,
      getOldestMessageQuery({ channelId: channel.id }),
    )

    if (!oldestMessage) {
      logger.warn('No messages to export!')
      process.exit(0)
    }

    const outputPath =
      argv.output ||
      `export-${channel.name}-${connection.serverId}${
        argv.range ? '-' + argv.range : ''
      }.json`
        .replace('#', '')
        .replace('/', '_')

    const writeStream = fs.createWriteStream(outputPath)

    writeStream.write('{\n  "messages": [\n')

    let after = oldestMessage.id
    let isRunning = true
    let isFirstRun = true
    while (isRunning) {
      const messagesAfter = await getRangeFilteredQuery(
        rangeStart,
        rangeEnd,
        getMessagesAfterQuery({
          limit: argv.stepLimit,
          channelId: channel.id,
          after,
        }),
      )

      const messages = isFirstRun
        ? fp.concat(oldestMessage, messagesAfter)
        : messagesAfter

      messagesCounter += messages.length

      const lastMessage = fp.last(messages)

      if (!lastMessage) {
        isRunning = false
        break
      }

      after = lastMessage.id

      const messagesJson = stringify(fp.map(mapMessage, messages), {
        cmp: cmpKeys([
          'id',
          'createdAt',
          'nick',
          'type',
          'text',
          'isOp',
          'isVoiced',
          'meta',
        ]),
        space: '  ',
      })
      const messagesContent =
        (isFirstRun ? '  ' : ',\n  ') +
        messagesJson.slice(2, -2).replace(/\n/g, '\n  ')

      writeStream.write(messagesContent)

      isFirstRun = false
    }

    const meta = {
      serverId: connection.serverId,
      nick: connection.nick,
      channelName: channel.name,
      range: argv.range,
      createdAt: new Date().toISOString(),
      version: '1',
    }

    const metaContent =
      stringify(meta, {
        cmp: cmpKeys([
          'serverId',
          'nick',
          'channelName',
          'range',
          'createdAt',
          'version',
        ]),
        space: '    ',
      }).slice(0, -1) + '  }'

    writeStream.write(`\n  ],\n  "meta": ${metaContent}\n}\n`)

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
