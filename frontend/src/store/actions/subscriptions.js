const autoSubscribe = () => dispatch => {
  dispatch({
    type: 'server/SUBSCRIBE_TO_CONNECTIONS',
  })
  dispatch({
    type: 'server/SUBSCRIBE_TO_CHANNELS',
  })
}

const subscribeToMessages = channelId => (dispatch, getState) => {
  const state = getState()

  if (!state.isSocketConnected) {
    return
  }

  if (state.isSubscribedToMessages[channelId]) {
    return
  }

  dispatch({
    type: 'server/SUBSCRIBE_TO_MESSAGES',
    payload: { channelId },
  })
}

const subscribeToUsers = channelId => (dispatch, getState) => {
  const state = getState()

  if (!state.isSocketConnected) {
    return
  }

  if (state.isSubscribedToUsers[channelId]) {
    return
  }

  const channel = state.channels[channelId]

  if (channel.type !== 'shared') {
    return
  }

  dispatch({
    type: 'server/SUBSCRIBE_TO_USERS',
    payload: { channelId },
  })
}

export { autoSubscribe, subscribeToMessages, subscribeToUsers }
