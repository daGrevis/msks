import fp from 'lodash/fp'
import * as querystring from 'querystring'

import store from '..'
import history from '../../routing/history'

const push = (pathname, query = {}) => dispatch => {
  const state = store.getState()

  const search = querystring.encode(query)
  const location = {
    ...history.location,
    pathname,
    search,
  }

  if (fp.isEqual(location, state.route.location)) {
    return
  }

  dispatch({
    type: 'PUSH',
    payload: location,
  })
  history.push(pathname + search)
}

const replace = (pathname, query = {}) => dispatch => {
  const search = querystring.encode(query)
  const location = {
    ...history.location,
    pathname,
    search,
  }

  dispatch({
    type: 'REPLACE',
    payload: location,
  })
  history.replace(pathname + search)
}

export { push, replace }
