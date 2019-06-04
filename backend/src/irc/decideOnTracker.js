const fp = require('lodash/fp')

const store = require('../store')

// Decides whether connection is tracking the channel.
const decideOnTracker = (connection, channelName, nick = null) => {
  const state = store.getState()

  const publicChannel = fp.find(
    channel =>
      channel.isPublic &&
      channel.name === channelName &&
      state.connections[channel.connectionId].serverId === connection.serverId,
    state.channels,
  )

  if (publicChannel) {
    const trackerConnection = state.connections[publicChannel.connectionId]
    const isTracker = trackerConnection.id === connection.id

    if (isTracker) {
      return {
        isPublic: true,
        isTracking: true,
        isTracker,
      }
    }

    const isTrackerJoined = state.isJoinedIrcChannel[publicChannel.id]

    return {
      isPublic: false,
      // Fallback to tracking this public channel if tracker has not joined or optional nick belongs to tracker.
      isTracking:
        !isTrackerJoined && (nick ? nick !== trackerConnection.nick : true),
      isTracker,
    }
  }

  return {
    isPublic: false,
    isTracking: true,
    isTracker: false,
  }
}

module.exports = decideOnTracker
