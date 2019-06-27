import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  'client/CONNECTION_CHANGES': ({ payload: { changes, isInitial } }) => state =>
    fp.pipe(
      fp.update(
        'isInitialConnectionsLoaded',
        isLoaded => isLoaded || isInitial,
      ),
      fp.update('connections', prevConnections => {
        const nextConnections =
          state.resetConnections || isInitial ? {} : { ...prevConnections }

        for (const { next, prev } of changes) {
          if (next) {
            nextConnections[next.id] = next
          } else {
            delete nextConnections[prev.id]
          }
        }

        return nextConnections
      }),
      fp.set('resetConnections', false),
    )(state),
})
