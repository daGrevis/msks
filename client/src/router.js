import _ from 'lodash'
import UniversalRouter from 'universal-router'

import routes from './routes'

const router = new UniversalRouter(
  _.map(routes, ({ path, meta = {} }) => ({
    path,
    action: context => ({
      context,
      path,
      meta,
    }),
  })),
)

export default router
