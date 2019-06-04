const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const toml = require('toml')

const logger = require('../env/logger')

const loadConfig = filename => {
  let configToml

  try {
    configToml = fs.readFileSync(path.resolve(__dirname, `../../${filename}`))
  } catch (e) {
    return {}
  }

  try {
    return toml.parse(configToml)
  } catch (e) {
    logger.error(`${filename}:${e.line}:${e.column}: ${e.message}`)
    process.exit(1)
  }
}

const defaultConfig = loadConfig('config.default.toml')
const userConfig = loadConfig('config.toml')

const config = _.defaultsDeep(userConfig, defaultConfig)

logger.verbose(`Config loaded! ${JSON.stringify(config, null, 2)}`)

module.exports = config
