const Store = require('./Store')

class UserStore extends Store {
  _serializeKey(key) {
    return JSON.stringify(key)
  }
}

module.exports = new UserStore()
