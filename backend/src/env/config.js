const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const toml = require('toml')

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
    console.error(e)
    process.exit(1)
  }
}

const defaultConfig = loadConfig('config.default.toml')
const userConfig = loadConfig('config.toml')

const config = _.defaultsDeep(userConfig, defaultConfig)

module.exports = config
