import createHistory from 'history/createBrowserHistory'
import * as qs from 'querystring'

import config from './config'

const history = createHistory()

const navigate = path => {
  history.push(config.basePath + path)
}

const getPathname = loc => {
  let path = loc.pathname + loc.hash

  path = path.replace(new RegExp(`^${config.basePath}`), '')
  if (path[0] !== '/') {
    path = '/' + path
  }

  path = path.replace(/\?.*/, '')

  return path
}

const getQuery = loc => {
  let path = loc.pathname + loc.hash + loc.search

  const search = path.replace(/[^?]*\??/, '')

  return qs.decode(search)
}

export {
  history,
  navigate,
  getPathname,
  getQuery,
}
