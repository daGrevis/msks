class UserCache {
  constructor() {
    this._cache = new Map()
  }

  get(key) {
    return this._cache.get(
      this._serializeKey(key)
    )
  }

  values() {
    return this._cache.values()
  }

  set(key, value) {
    this._cache.set(
      this._serializeKey(key),
      value
    )
  }

  delete(key) {
    this._cache.delete(
      this._serializeKey(key)
    )
  }

  _serializeKey(key) {
    return JSON.stringify(key)
  }
}

module.exports = new UserCache()
