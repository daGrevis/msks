import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  SET_BROKEN: () => fp.set('isBroken', true),

  SET_VISIBLE: () => fp.set('isVisible', true),

  SET_HIDDEN: () => fp.set('isVisible', false),

  SAVE_LAST_SCROLL_POSITION: ({ payload: { id, position } }) =>
    fp.set(['scrollPositions', id], position),
})
