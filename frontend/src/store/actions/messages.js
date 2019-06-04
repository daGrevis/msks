import fp from 'lodash/fp'
import uuidv4 from 'uuid/v4'

import { push } from './router'
import { getCommand } from './commands'
import http from '../../networking/http'
import { getLinkToChannel } from '../../routing/links'
import { channelNameSelector } from '../selectors/router'
import { connectionSelector } from '../selectors/connections'
import { channelSelector } from '../selectors/channels'
import { channelUserSelector } from '../selectors/users'
import { hasSessionSelector } from '../selectors/session'

const getMessages = query => async dispatch => {
  dispatch({
    type: 'GET_MESSAGES',
    payload: {
      query,
    },
  })

  const response = await http.get('/api/messages', { params: query })

  dispatch({
    type: 'SET_MESSAGES',
    payload: response.data,
  })
}

const getMessagesBefore = query => async dispatch => {
  dispatch({
    type: 'GET_MESSAGES_BEFORE',
    payload: {
      query,
    },
  })

  const response = await http.get('/api/messages', { params: query })

  dispatch({
    type: 'SET_MESSAGES_BEFORE',
    payload: response.data,
  })
}

const getMessagesAfter = query => async dispatch => {
  dispatch({
    type: 'GET_MESSAGES_AFTER',
    payload: {
      query,
    },
  })

  const response = await http.get(`/api/messages`, { params: query })

  dispatch({
    type: 'SET_MESSAGES_AFTER',
    payload: response.data,
  })
}

const getMessagesAround = query => async dispatch => {
  dispatch({
    type: 'GET_MESSAGES_AROUND',
    payload: {
      query,
    },
  })

  const response = await http.get(`/api/messages`, { params: query })

  dispatch({
    type: 'SET_MESSAGES_AROUND',
    payload: response.data,
  })
}

const sendMessage = payload => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channel = channelSelector(state)
  const channelName = channelNameSelector(state)
  const channelUser = channelUserSelector(state)

  const { text } = payload

  if (!text) {
    return
  }

  const isCommandLike = fp.startsWith('/', text)
  const isCommandEscaped = fp.startsWith('//', text)
  const isCommand = isCommandLike && !isCommandEscaped

  const unescapedText = isCommandEscaped ? text.slice(1) : text

  const commandText = isCommand
    ? text
    : `/query ${channel ? channel.name : channelName} ${unescapedText}`

  const { commandAction, commandParams } = getCommand(commandText)

  if (commandAction) {
    dispatch(commandAction(commandParams))

    if (!isCommand) {
      if (channel) {
        dispatch({
          type: 'APPEND_MESSAGE',
          payload: {
            channel,
            message: {
              id: uuidv4(),
              createdAt: new Date(),
              nick: connection.nick,
              type: 'text',
              text: unescapedText,
              isOp: channelUser && channelUser.isOp,
              isVoiced: channelUser && channelUser.isVoiced,
              isOptimistic: true,
            },
          },
        })
      }
    }
  } else {
    if (channel) {
      dispatch({
        type: 'APPEND_MESSAGE',
        payload: {
          channel,
          message: {
            id: uuidv4(),
            createdAt: new Date(),
            type: 'client',
            text: `Command "${text}" not recognized`,
          },
        },
      })
    }
  }
}

const leaveArchive = () => (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channel = channelSelector(state)
  const hasSession = hasSessionSelector(state)

  dispatch({
    type: 'LEAVE_ARCHIVE',
    payload: {
      channel,
      connection,
    },
  })

  dispatch(
    push(
      getLinkToChannel(
        connection.serverId,
        hasSession && connection.nick,
        channel.name,
      ),
    ),
  )

  dispatch(getMessages({ channelId: channel.id }))
}

const pushMessageInputHistory = text => ({
  type: 'PUSH_MESSAGE_INPUT_HISTORY',
  payload: { text },
})

export {
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
  sendMessage,
  leaveArchive,
  pushMessageInputHistory,
}
