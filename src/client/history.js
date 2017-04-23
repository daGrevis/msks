import createHistory from 'history/createBrowserHistory'

const basePath = process.env.REACT_APP_BASE_PATH || '/'

const history = createHistory()

const navigate = path => {
  history.push(basePath + path)
}

const getPath = loc =>
  '/' + (loc.pathname + loc.hash).replace(new RegExp(`^${basePath}`), '')

export {
  history,
  navigate,
  getPath,
}
