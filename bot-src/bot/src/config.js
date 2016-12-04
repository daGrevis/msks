const fp = require('lodash/fp')

const obfuscateConfig = fp.set('ircPassword', '***')

try {
  const config = require('../config.json')
  console.log('config loaded', obfuscateConfig(config))
  module.exports = config
} catch(err) {
  console.info('Config not found or invalid, see config.example.json')
  console.error(err)
  process.exit(1)
}
