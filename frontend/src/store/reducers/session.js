import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

const resetSession = fp.pipe(
  fp.set('scrollPositions', {}),
  fp.set('session', null),
  fp.set('connections', {}),
  fp.set('channels', {}),
  fp.set('messages', {}),
  fp.set('users', {}),
  fp.set('search', {}),
  fp.set('isViewingArchive', {}),
  fp.set('hasReachedBeginning', {}),
)

export default handleActions({
  LOGIN_SUCCESS: ({ payload }) =>
    fp.pipe(
      resetSession,
      fp.set('session', payload),
    ),

  LOGOUT: () => resetSession,
})
