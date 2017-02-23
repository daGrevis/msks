// Based on https://github.com/mickhansen/retry-as-promised, MIT licensed.

const Promise = require('bluebird')
const v4 = require('uuid')

const shortV4 = () => v4().split('-')[0]

const retry = (fn, opts = {}) => {
  opts = {
    _id: opts._id || shortV4(),
    _attempt: opts._attempt || 1,
    _totalDelay: opts._totalDelay || 0,
    _hasFailedBefore: opts._hasFailedBefore || false,

    max: opts.max || 200,
    backoffBase: opts.backoffBase === undefined ? 200 : opts.backoffBase,
    backoffExponent: opts.backoffExponent || 1.05,
    backoffLimit: opts.backoffLimit || 60 * 1000,
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

    Promise.resolve(fn()).then(() => {
      const message = `Resolved ${displayName} (delayed by ${Math.round(opts._totalDelay)}ms)`
      if (opts._hasFailedBefore) {
        console.log(message)
      } else if (opts.debug) {
        console.log(message)
      }

      resolve()
    }).tap(function () {
      if (backoffTimeout) {
        clearTimeout(backoffTimeout)
      }
    }).catch(function (err) {
      opts._hasFailedBefore = true

      if (backoffTimeout) {
        clearTimeout(backoffTimeout)
      }

      let shouldRetry = opts._attempt < opts.max

      if (!shouldRetry) {
        return reject(err)
      }

      opts._attempt++

      // Use backoff function to ease retry rate
      opts.backoffBase = Math.min(Math.pow(opts.backoffBase, opts.backoffExponent), opts.backoffLimit)

      opts._totalDelay += opts.backoffBase

      console.log(`Rejected ${displayName} (retrying in ${Math.round(opts.backoffBase)}ms)`)
      if (err) {
        console.error(err.toString() || err)
      }

      backoffTimeout = setTimeout(function() {
        retry(fn, opts)
          .then(() => {
            resolve()
          })
          .catch(reject)
      }, opts.backoffBase)
    })
  })
}

module.exports = (fn, opts = {}) => (...args) =>
  retry(
    (() => fn(...args)),
    { name: opts.name || fn.name }
  )
