try {
  module.exports = require('./config.json')
} catch(err) {
  console.info('Config not found or invalid, see config.example.json')
  console.error(err)
  process.exit(1)
}
