const fp = require('lodash/fp')
const { handleActions } = require('redux-fp')

module.exports = handleActions({
  SYNC_POSTGRES: ({ payload: { table, change, changes } }) =>
    fp.update(table, rows => {
      for (const { next, prev } of changes || [change]) {
        if (next) {
          rows[next.id] = next
        } else {
          delete rows[prev.id]
        }
      }
      return rows
    }),
})
