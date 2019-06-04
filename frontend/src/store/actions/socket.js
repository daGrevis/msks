import { hasSessionSelector } from '../selectors/session'
import { autoSubscribe } from './subscriptions'

const authenticateSocket = () => (dispatch, getState) => {
  const state = getState()

  const { session } = state

  dispatch({
    type: 'server/AUTHENTICATE_SOCKET',
    payload: {
      sessionId: session.id,
      token: session.token,
    },
  })
}

const socketConnected = () => (dispatch, getState) => {
  const state = getState()

  // Listening socket.on('reconnect') doesn't work when manually calling socket.disconnect() and socket.connect().
  const isReconnected = !!state.hasSocketBeenDisconnected

  dispatch({
    type: 'SOCKET_CONNECTED',
    payload: { isReconnected },
  })

  const hasSession = hasSessionSelector(state)

  if (hasSession) {
    dispatch(authenticateSocket())
  } else {
    dispatch(autoSubscribe())
  }
}

export { authenticateSocket, socketConnected }
