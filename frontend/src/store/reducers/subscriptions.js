import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  'server/SUBSCRIBE_TO_MESSAGES': ({ payload }) =>
    fp.set(['isSubscribedToMessages', payload.channelId], true),

  'server/SUBSCRIBE_TO_USERS': ({ payload }) =>
    fp.set(['isSubscribedToUsers', payload.channelId], true),
})
