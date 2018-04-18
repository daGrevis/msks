import createHistory from 'history/createBrowserHistory'

import config from './config'

const history = createHistory({
  basename: config.basePath,
})

export default history
