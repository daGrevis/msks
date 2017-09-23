import Router from 'universal-router'

import routes from './routes'

const router = new Router(
  routes.map(route => {
    const { path, meta } = route

    return {
      ...route,
      action: (context, params) => ({
        params,
        path: path || {},
        meta: meta || {},
      }),
    }
  }),
)

export default router
