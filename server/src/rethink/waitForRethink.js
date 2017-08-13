const Promise = require('bluebird')
const _ = require('lodash')

const migrations = require('./migrations')

const waitForRethink = async () => {
  await Promise.all(_.map(migrations, fn =>
    fn.run().catch(_.noop)
  ))
}

module.exports = waitForRethink
