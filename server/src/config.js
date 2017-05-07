const fs = require('fs')

const fp = require('lodash/fp')
const toml = require('toml')

const logger = require('./logger')

const obfuscateConfig = fp.update(['irc', 'password'], s => s === '' ? '' : '***')

let configToml

try {
  configToml = fs.readFileSync('config.toml')
} catch (e) {
  logger.error('Could not find config.toml, see config.example.toml!')
  process.exit(1)
}

const config = toml.parse(configToml)

logger.verbose(`Config loaded! ${JSON.stringify(obfuscateConfig(config))}`)

module.exports = config
