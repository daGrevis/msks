import fp from 'lodash/fp'
import uuidv4 from 'uuid/v4'

import http from '../../networking/http'
import { getLinkToFront, getLinkToChannel } from '../../routing/links'
import { connectionSelector } from '../selectors/connections'
import { channelNameSelector } from '../selectors/router'
import { channelSelector } from '../selectors/channels'
import { push } from './router'

const runCommand = (name, payload) => async (dispatch, getState) => {
  const typePrefix = `commands/${fp.toUpper(name)}`

  dispatch({
    type: typePrefix,
    payload,
  })

  try {
    await http.post(`/api/commands/${name}`, payload)
  } catch (e) {
    dispatch({
      type: `${typePrefix}_FAILURE`,
      payload: e.response.data,
    })

    const state = getState()

    const channel = channelSelector(state)

    if (e.response.data && e.response.data.error) {
      dispatch({
        type: 'APPEND_MESSAGE',
        payload: {
          channel,
          message: {
            id: uuidv4(),
            createdAt: new Date(),
            type: 'client',
            text: e.response.data.error,
          },
        },
      })
    }

    return false
  }

  dispatch({
    type: `${typePrefix}_SUCCESS`,
    payload,
  })

  return true
}

const query = params => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)

  const channelName = params.split(' ', 1)[0]
  const text = params.slice(channelName.length + 1)

  if (!text) {
    // Open channel or server when no text is given.
    dispatch(
      push(
        getLinkToChannel(
          connection.serverId,
          connection.nick,
          channelName || '*',
        ),
      ),
    )
    return
  }

  const payload = {
    connectionId: connection.id,
    channelName,
    text,
  }

  const isOk = await dispatch(runCommand('query', payload))

  if (isOk) {
    dispatch(
      push(getLinkToChannel(connection.serverId, connection.nick, channelName)),
    )
  }
}

const join = params => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channelName = params || channelNameSelector(state)

  const payload = {
    connectionId: connection.id,
    channelName,
  }

  const isOk = await dispatch(runCommand('join', payload))

  if (isOk) {
    dispatch(
      push(getLinkToChannel(connection.serverId, connection.nick, channelName)),
    )
  }
}

const leave = params => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channel = channelSelector(state)

  const connectionId = connection.id
  const channelName = params || channel.name

  const payload = {
    connectionId,
    channelName,
  }

  dispatch(runCommand('leave', payload))
}

const quit = () => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)

  const payload = {
    connectionId: connection.id,
  }

  dispatch(runCommand('quit', payload))
}

const connect = () => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)

  const payload = {
    connectionId: connection.id,
  }

  dispatch(runCommand('connect', payload))
}

const notice = params => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channelName = channelNameSelector(state)

  const payload = {
    connectionId: connection.id,
    channelName,
    text: params,
  }

  dispatch(runCommand('notice', payload))
}

const action = params => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channel = channelSelector(state)

  const payload = {
    connectionId: connection.id,
    channelId: channel.id,
    text: params,
  }

  dispatch(runCommand('action', payload))
}

const kick = params => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channel = channelSelector(state)

  const nick = params.split(' ', 1)[0]
  const text = params.slice(nick.length + 1)

  const payload = {
    connectionId: connection.id,
    channelId: channel.id,
    nick,
    text,
  }

  dispatch(runCommand('kick', payload))
}

const mode = params => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channel = channelSelector(state)

  const mode = params.split(' ', 1)[0]
  const target = params.slice(mode.length + 1)

  const payload = {
    connectionId: connection.id,
    channelId: channel.id,
    mode,
    target,
  }

  dispatch(runCommand('mode', payload))
}

const withMode = mode => params => (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channel = channelSelector(state)

  const target = params

  const payload = {
    connectionId: connection.id,
    channelId: channel.id,
    mode,
    target,
  }

  dispatch(runCommand('mode', payload))
}

const whois = params => async (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)

  const nick = params || channelNameSelector(state)

  const payload = {
    connectionId: connection.id,
    nick,
  }

  const isOk = await dispatch(runCommand('whois', payload))

  if (isOk) {
    dispatch(push(getLinkToChannel(connection.serverId, connection.nick, nick)))
  }
}

const hide = () => async (dispatch, getState) => {
  const state = getState()

  const channel = channelSelector(state)

  const payload = {
    channelId: channel.id,
  }

  const isOk = await dispatch(runCommand('hide', payload))

  if (isOk) {
    dispatch(push(getLinkToFront()))
  }
}

const COMMAND_MAP = {
  query,
  q: query,
  msg: query,
  show: query,
  join,
  j: join,
  leave,
  part: leave,
  quit,
  disconnect: quit,
  connect,
  notice,
  action,
  me: action,
  kick,
  mode,
  op: withMode('+o'),
  deop: withMode('-o'),
  voice: withMode('+v'),
  devoice: withMode('-v'),
  ban: withMode('+b'),
  unban: withMode('-b'),
  whois,
  hide,
  close: hide,
}

const getCommand = text => {
  const commandName = text.slice(1).split(' ', 1)[0]
  const commandParams = text.slice(commandName.length + 2)

  const commandAction = COMMAND_MAP[commandName]

  return {
    commandName,
    commandParams,
    commandAction,
  }
}

export { getCommand, COMMAND_MAP }
