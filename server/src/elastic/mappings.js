const elastic = require('./index')

const runMappings = async () => {
  if (!await elastic.indices.exists({ index: 'messages' })) {
    await elastic.indices.create({
      index: 'messages',
    })

    await elastic.indices.close({ index: 'messages' })

    await elastic.indices.putSettings({
      index: 'messages',
      body: {
        analysis: {
          normalizer: {
            custom_normalizer: {
              type: 'custom',
              char_filter: [],
              filter: ['lowercase'],
            }
          },
          analyzer: {
            custom_analyzer: {
              type: 'standard',
              stopwords: '_english_,_latvian_',
            },
          },
        }
      }
    })

    await elastic.indices.putMapping({
      index: 'messages',
      type: 'message',
      body: {
        properties: {
          timestamp: {
            type: 'date',
          },
          from: {
            type: 'keyword',
            normalizer: 'custom_normalizer',
          },
          to: {
            type: 'keyword',
            normalizer: 'custom_normalizer',
          },
          text: {
            type: 'text',
            analyzer: 'custom_analyzer',
          },
        },
      },
    })

    await elastic.indices.open({ index: 'messages' })
  }
}

module.exports = {
  runMappings,
}
