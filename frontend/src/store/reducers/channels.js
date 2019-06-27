import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  'client/CHANNEL_CHANGES': ({ payload: { changes, isInitial } }) => state =>
    fp.pipe(
      fp.update('isInitialChannelsLoaded', isLoaded => isLoaded || isInitial),
      fp.update('channels', prevChannels => {
        const nextChannels =
          state.resetChannels || isInitial ? {} : { ...prevChannels }

        for (const { next, prev } of changes) {
          if (next) {
            nextChannels[next.id] = next
          } else {
            delete nextChannels[prev.id]
          }
        }

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
