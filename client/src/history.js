import createHistory from 'history/createBrowserHistory'

import config from './config'

const history = createHistory()

const navigate = path => {
  history.push(config.basePath + path)
}

const getPath = loc =>
  '/' + (loc.pathname + loc.hash).replace(new RegExp(`^${config.basePath}`), '')

export {
  history,
  navigate,
  getPath,
}
