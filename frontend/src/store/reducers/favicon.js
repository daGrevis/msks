import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  INCREASE_UNREAD: () => fp.update('unread', count => count + 1),
  RESET_UNREAD: () => fp.set('unread', 0),
})
