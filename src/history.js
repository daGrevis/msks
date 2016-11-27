import createHistory from 'history/createBrowserHistory'

const history = createHistory()

function navigate(path) {
  history.push(path)
}

window.h = history
window.navigate = navigate

export {
  history,
  navigate,
}
