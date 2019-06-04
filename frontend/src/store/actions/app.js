import fp from 'lodash/fp'

import { setFaviconBadge } from './favicon'

const setVisible = () => (dispatch, getState) => {
  const state = getState()

  dispatch({
    type: 'SET_VISIBLE',
  })

  if (state.unread > 0) {
    dispatch({
      type: 'RESET_UNREAD',
    })
    dispatch(setFaviconBadge())
  }
}

const setHidden = () => ({
  type: 'SET_HIDDEN',
})

const setTitle = title => dispatch => {
  if (document.title !== title) {
    dispatch({
      type: 'SET_TITLE',
      payload: title,
    })

    document.title = title
  }
}

const saveLastScrollPosition = ({ id, position }) => (dispatch, getState) => {
  const state = getState()

  if (fp.isEqual(fp.get(['scrollPositions', id], state), position)) {
    return
  }

  dispatch({
    type: 'SAVE_LAST_SCROLL_POSITION',
    payload: { id, position },
  })
}

export { setVisible, setHidden, setTitle, saveLastScrollPosition }
