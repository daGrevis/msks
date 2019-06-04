const fp = require('lodash/fp')
const { handleActions } = require('redux-fp')

module.exports = handleActions({
  SYNC_POSTGRES: ({ payload: { table, change, changes } }) =>
    fp.update(table, rows =>
      fp.reduce(
        (rows, { next, prev }) =>
          next ? fp.set(next.id, next, rows) : fp.unset(prev.id, rows),
        rows,
        changes || [change],
      ),
    ),
})
