import http from '../../networking/http'

const readChannel = channel => async (dispatch, getState) => {
  const state = getState()

  if (channel.unread > 0 && !state.isPuttingChannelRead[channel.id]) {
    dispatch({
      type: 'READ_CHANNEL',
      payload: { channelId: channel.id },
    })

    await http.put('/api/channels/read', { channelId: channel.id })

    dispatch({
      type: 'READ_CHANNEL_SUCCESS',
      payload: { channelId: channel.id },
    })
  }
}

export { readChannel }
