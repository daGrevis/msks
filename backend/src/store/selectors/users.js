const fp = require('lodash/fp')

const { createPublicChannelSelector } = require('./channels')

const createChannelUsersSelector = channel => state => {
  if (!channel.isPublic) {
    const publicChannel = createPublicChannelSelector(channel)(state)

    if (publicChannel) {
      const isJoined = !!state.isJoinedIrcChannel[channel.id]
      const isTrackerJoined = !!state.isJoinedIrcChannel[publicChannel.id]

      const channelId =
        isJoined && !isTrackerJoined ? channel.id : publicChannel.id

      return fp.filter({ channelId }, state.users)
    }
  }

  return fp.filter({ channelId: channel.id }, state.users)
}

module.exports = {
  createChannelUsersSelector,
}
