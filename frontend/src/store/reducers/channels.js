import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  'client/CHANNEL_CHANGES': ({ payload: { changes, isInitial } }) => state =>
    fp.pipe(
      fp.update('isInitialChannelsLoaded', isLoaded => isLoaded || isInitial),
      fp.update('channels', prevChannels => {
        prevChannels = state.resetChannels || isInitial ? {} : prevChannels

        const nextChannels = fp.reduce(
          (channels, { next, prev }) =>
            next
              ? fp.set(next.id, next, channels)
              : fp.unset(prev.id, channels),
          prevChannels,
          changes,
        )

        return nextChannels
      }),
      fp.set('resetChannels', false),
    )(state),

  READ_CHANNEL: ({ payload: { channelId } }) =>
    fp.pipe(
      fp.set(['isPuttingChannelRead', channelId], true),
      fp.set(['channels', channelId, 'unread'], 0),
    ),

  READ_CHANNEL_SUCCESS: ({ payload: { channelId } }) =>
    fp.set(['isPuttingChannelRead', channelId], false),
})
