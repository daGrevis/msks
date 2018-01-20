import createHistory from 'history/createBrowserHistory'
import * as querystring from 'querystring'

import config from './config'

const history = createHistory({
  basename: config.basePath,
})

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

  return querystring.decode(search)
}

const push = (path, query = {}) => {
  history.push(path + querystring.encode(query))
}

const replace = (path, query = {}) => {
  history.replace(path + querystring.encode(query))
}

export {
  history,
  getPathname,
  getQuery,
  push,
  replace,
}
