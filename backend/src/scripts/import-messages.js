const fs = require('fs')

const fp = require('lodash/fp')
const yargs = require('yargs')
const JSONStream = require('JSONStream')

const logger = require('../env/logger')
const postgres = require('../postgres')

const { argv } = yargs
  .command('$0 <channelId> <input>')
  .option('channelId', {
    string: true,
  })
  .option('input', {
    string: true,
  })
  .option('stepLimit', {
    number: true,
    default: 1000,
  })
  .version(false)
  .option('h', {
    alias: 'help',
  })

const mapMessage = message => ({
  ...message,
  channelId: argv.channelId,
  text: message.text || '',
})

const importMessages = async messages =>
  postgres.raw('? ON CONFLICT DO NOTHING', [
    postgres('messages').insert(fp.map(mapMessage, messages)),
  ])

const run = () =>
  new Promise(resolve => {
    const importPromises = []
    let stepMessages = []
    let messagesCounter = 0

    fs.createReadStream(argv.input)
      .pipe(JSONStream.parse('messages.*'))
      .on('data', message => {
        stepMessages.push(message)

        if (stepMessages.length === argv.stepLimit) {
          importPromises.push(importMessages(stepMessages))
          messagesCounter += stepMessages.length
          stepMessages = []
        }
      })
      .on('end', async () => {
        if (stepMessages.length > 0) {
          importPromises.push(importMessages(stepMessages))
          messagesCounter += stepMessages.length
          stepMessages = []
        }

        await Promise.all(importPromises)

        logger.info(
          `Successfully imported ${messagesCounter} message${
            messagesCounter !== 1 ? 's' : ''
          } from ${argv.input} to channel with ID ${argv.channelId}!`,
        )

        resolve()
      })
  })

run().then(() => process.exit(0))
