import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

import router from '../../routing/router'

const onNavigated = payload => state => {
  const resolvedRoute = router.resolve(payload.location)

  return fp.set(
    'route',
    {
      ...payload,
      ...resolvedRoute,
    },
    state,
  )
}

export default handleActions({
  NAVIGATED: ({ payload }) => onNavigated(payload),
  PUSH: ({ payload }) => onNavigated({ location: payload, action: 'PUSH' }),
  REPLACE: ({ payload }) =>
    onNavigated({ location: payload, action: 'REPLACE' }),
})
