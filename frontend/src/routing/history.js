import { createBrowserHistory } from 'history'

import config from '../env/config'

const history = createBrowserHistory({
  basename: config.basePath,
})

export default history
