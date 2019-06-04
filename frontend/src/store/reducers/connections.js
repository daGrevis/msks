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
        prevConnections =
          state.resetConnections || isInitial ? {} : prevConnections

        const nextConnections = fp.reduce(
          (connections, { next, prev }) =>
            next
              ? fp.set(next.id, next, connections)
              : fp.unset(prev.id, connections),
          prevConnections,
          changes,
        )

        return nextConnections
      }),
      fp.set('resetConnections', false),
    )(state),
})
