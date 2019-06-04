import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  SOCKET_CONNECTED: ({ payload }) => state =>
    fp.pipe(
      fp.set('isSocketConnected', true),
      fp.set('isSocketReconnected', payload.isReconnected),
      fp.set('resetChannels', true),
      fp.set('resetConnections', true),
      fp.set('resetUsers', fp.mapValues(() => true, state.users)),
    )(state),

  SOCKET_DISCONNECTED: () =>
    fp.pipe(
      fp.set('isSocketConnected', false),
      fp.set('isSocketReconnected', false),
      fp.set('hasSocketBeenDisconnected', true),
      fp.set('isSubscribedToMessages', {}),
      fp.set('isSubscribedToUsers', {}),
      fp.update('isViewingArchive', fp.mapValues(() => true)),
    ),

  // TODO: Resubscribe to avoid need to reload page.
  'client/SOCKET_UNAUTHENTICATED': () => fp.set('session', null),
})
