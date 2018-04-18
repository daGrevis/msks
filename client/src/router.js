import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'
import * as querystring from 'querystring'

import config from './config'
import routes from './routes'

const getPathname = location => {
  let path = location.pathname + location.hash

  path = path.replace(new RegExp(`^${config.basePath}`), '')
  if (path[0] !== '/') {
    path = '/' + path
  }

  path = path.replace(/\?.*/, '')

  return path
}

const getQuery = location => {
  let path = location.pathname + location.hash + location.search

  const search = path.replace(/[^?]*\??/, '')

  return querystring.decode(search)
}

class Router {
  compiledRoutes = []

  constructor(routes) {
    this.compiledRoutes = _.map(routes, route => {
      const keys = []
      const regexp = pathToRegexp(route.path, keys)

      return { route, regexp, keys }
    })
  }

  resolve(location) {
    const pathname = getPathname(location)

    const compiledRoute = _.find(this.compiledRoutes, ({ route, regexp }) => regexp.test(pathname))

    if (!compiledRoute) {
      return { params: {}, path: '/', meta: {}, is404: true }
    }

    const params = _.fromPairs(_.map(
      compiledRoute.regexp.exec(pathname).slice(1),
      (value, i) => [compiledRoute.keys[i].name, value],
    ))

    const { path, meta = {} } = compiledRoute.route

    const query = getQuery(location)

    return { path, params, meta, pathname, query }
  }
}

const router = new Router(routes)

export default router
