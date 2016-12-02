try {
  const config = require('../config.json')
  console.log('config loaded', config)
  module.exports = config
} catch(err) {
  console.info('Config not found or invalid, see config.example.json')
  console.error(err)
  process.exit(1)
}
