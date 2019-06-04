import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'
import * as qs from 'qs'

import routes from './routes'

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
    const { pathname, search } = location

    const compiledRoute = _.find(this.compiledRoutes, ({ regexp }) =>
      regexp.test(pathname),
    )

    if (!compiledRoute) {
      return { params: {}, path: '/', meta: {}, is404: true }
    }

    const { regexp } = compiledRoute
    const matches = regexp.exec(pathname)

    const params = _.fromPairs(
      _.map(matches.slice(1), (value, i) => [
        compiledRoute.keys[i].name,
        value,
      ]),
    )

    const { path, meta = {} } = compiledRoute.route

    const query = qs.parse(search, { ignoreQueryPrefix: true })

    return { path, params, meta, pathname, query }
  }
}

const router = new Router(routes)

export default router
