import { createAction } from 'redux-actions'
import io from 'socket.io-client'

const addMessage = createAction('ADD_MESSAGE')

const loadMessages = () => dispatch => {
  console.log('calling loadMessages')

  const socket = io('http://localhost:3000')

  socket.on('message', change => {
    const messageNew = change.new_val
    dispatch(addMessage(messageNew))
  })

  dispatch({ type: 'LOAD_MESSAGES' })
}

export {
  loadMessages,
}
