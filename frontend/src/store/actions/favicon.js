import Favico from 'favico.js'

const favico = new Favico({
  animation: 'none',
  bgColor: '#e91e63',
})

const setFaviconBadge = () => (dispatch, getState) => {
  const { unread } = getState()

  favico.badge(unread)
}

export { setFaviconBadge }
