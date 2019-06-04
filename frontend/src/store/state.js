import history from '../routing/history'

const initialState = {
  isBroken: false,

  isVisible: true,

  isSocketConnected: false,
  hasSocketBeenDisconnected: false,
  isSocketReconnected: false,

  route: {
    location: history.location,
    action: 'PUSH',
    path: '',
    params: {},
    meta: {},
    pathname: '',
    query: {},
  },

  scrollPositions: {
    // 'messages.#developerslv': 123,
    // 'search.#developerslv': 234,
  },

  session: null,

  isInitialChannelsLoaded: false,
  channels: {},
  resetChannels: false,

  isInitialConnectionsLoaded: false,
  connections: {},
  resetConnections: false,

  users: {},
  resetUsers: false,

  isLoadingMessages: {
    // [channelId]: true,
  },

  isPuttingChannelRead: {
    // [channelId]: true,
  },

  messages: {},

  search: {
    // [channelId]: {
    //   query: {
    //     // text: 'bar',
    //   },
    //   messages: [],
    //   hasReachedBeginning: false,
    //   isOutdated: false,
    // },
  },

  isSubscribedToMessages: {
    // [channelId]: true,
  },
  isSubscribedToUsers: {
    // [channelId]: true,
  },

  isViewingArchive: {
    // [channelId]: false,
  },

  hasReachedBeginning: {
    // [channelId]: true,
  },

  unread: 0,

  messageInputHistory: [],
}

export { initialState }
