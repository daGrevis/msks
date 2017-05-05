// Based on https://github.com/mickhansen/retry-as-promised, MIT licensed.

const Promise = require('bluebird')
const v4 = require('uuid')

const shortV4 = () => v4().split('-')[0]

const BACKOFF_DELAYS = [100, 200, 500, 1000, 1500, 2000, 5000]

const retry = (fn, opts = {}) => {
  opts = {
    _id: opts._id || shortV4(),
    _attempt: opts._attempt || 1,
    _hasFailedBefore: opts._hasFailedBefore || false,
    _startedAt: opts._startedAt || new Date(),

    name: opts.name || null,
    debug: opts.debug || false,
  }

  const displayName = (
    opts.name
    ? `${opts.name}, ID ${opts._id}`
    : opts._id
  )

  if (opts.debug) {
    console.log(`Trying ${displayName}`)
  }

  return new Promise(function (resolve, reject) {
    let backoffTimeout

    Promise.resolve(fn()).then(value => {
      const totalDelay = new Date() - opts._startedAt

      const message = `Resolved ${displayName} (delayed by ${totalDelay}ms)`
      if (opts._hasFailedBefore) {
        console.log(message)
      } else if (opts.debug) {
        console.log(message)
      }

      resolve(value)
    }).tap(function () {
      if (backoffTimeout) {
        clearTimeout(backoffTimeout)
      }
    }).catch(function (err) {
      opts._hasFailedBefore = true

      if (backoffTimeout) {
        clearTimeout(backoffTimeout)
      }

      let shouldRetry = opts._attempt - 1 < BACKOFF_DELAYS.length

      if (!shouldRetry) {
        return reject(err)
      }

      opts._currentDelay = BACKOFF_DELAYS[opts._attempt - 1]

      opts._attempt++

      console.log(`Rejected ${displayName} (retrying in ${opts._currentDelay}ms)`)
      if (err) {
        console.error(err.toString() || err)
      }

      backoffTimeout = setTimeout(function() {
        retry(fn, opts)
          .then(() => {
            resolve()
          })
          .catch(reject)
      }, opts._currentDelay)
    })
  })
}

module.exports = (fn, opts = {}) => (...args) =>
  retry(
    (() => fn(...args)),
    { name: opts.name || fn.name }
  )
