import http from '../../networking/http'
import socket from '../../networking/socket'
import { authenticateSocket } from './socket'

const login = ({ username, password }) => async dispatch => {
  dispatch({
    type: 'LOGIN',
    payload: { username, password },
  })

  let response
  try {
    response = await http.post('/api/sessions', { username, password })
  } catch (e) {
    const { errors } = e.response.data

    dispatch({
      type: 'LOGIN_FAILURE',
      payload: errors,
    })

    return { errors }
  }

  const { session } = response.data

  dispatch({
    type: 'LOGIN_SUCCESS',
    payload: session,
  })

  dispatch(authenticateSocket())

  return { session }
}

const logout = () => dispatch => {
  dispatch({
    type: 'LOGOUT',
  })

  socket.disconnect()
  setTimeout(() => {
    socket.connect()
  }, 0)
}

export { login, logout }
