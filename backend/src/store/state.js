const initialState = {
  processUptime: new Date(),

  // connectionId: connection
  connections: {},

  // channelId: channel
  channels: {},

  // userId: user
  users: {},

  // connectionId: ircClient
  ircClients: {},

  // connectionId: nick
  ircClientNicks: {},

  // connectionId: boolean
  isIrcClientConnected: {},

  // connectionId: { [nick]: { allowance, timestamp } }
  rateLimits: {},

  // channelId: boolean
  isJoinedIrcChannel: {},

  // socketId: socket
  socketClients: {},

  // socketId: session
  socketSessions: {},

  // [socketId, channelId]: boolean
  isSubscribedToConnections: {},

  // socketId: boolean
  isSubscribedToChannels: {},

  // socketId: boolean
  isSubscribedToMessages: {},

  // socketId: boolean
  isSubscribedToUsers: {},

  // channelId: number
  unread: {},

  // connectionId: number
  connectionAttempts: {},
}

module.exports = {
  initialState,
}
