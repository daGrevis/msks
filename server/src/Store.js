class Store {
  constructor() {
    this._store = new Map()
  }

  get(key) {
    return this._store.get(
      this._serializeKey(key)
    )
  }

  values() {
    return this._store.values()
  }

  set(key, value) {
    this._store.set(
      this._serializeKey(key),
      value
    )
  }

  delete(key) {
    this._store.delete(
      this._serializeKey(key)
    )
  }

  _serializeKey(key) {
    return key
  }
}

module.exports = Store
