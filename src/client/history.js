import createHistory from 'history/createBrowserHistory'

const history = createHistory()

function navigate(path) {
  history.push(path)
}

export {
  history,
  navigate,
}
