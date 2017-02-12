import createHistory from 'history/createBrowserHistory'

const basePath = process.env.REACT_APP_BASE_PATH || '/'

const history = createHistory()

function navigate(path) {
  history.push(basePath + path)
}

export {
  history,
  navigate,
}
