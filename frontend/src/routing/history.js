import createHistory from 'history/createBrowserHistory'

import config from '../env/config'

const history = createHistory({
  basename: config.basePath,
})

export default history
