import config from '../env/config'

// eslint-disable-next-line import/no-mutable-exports
let routes

if (config.isPublicEmbed) {
  routes = [
    {
      path: '/',
      meta: { isChannel: true },
    },
    {
      path: '/:messageId',
      meta: { isChannel: true },
    },
  ]
} else {
  routes = [
    {
      path: '/',
      meta: { isFront: true },
    },
    {
      // Second param can be a nick which would shift channelName and optional messageId to the right.
      //
      // e.g. routes:
      // /freenode/~developerslv
      // /freenode/~developerslv/00000000-0000-0000-0000-000000000000
      // /freenode/daGrevis/~developerslv
      // /freenode/daGrevis/~developerslv/00000000-0000-0000-0000-000000000000
      //
      // One should use serverIdSelector, nickSelector, channelNameSelector & messageIdSelector to access params.
      path:
        '/:serverId/:channelNameOrNick/:channelNameOrMessageId?/:messageId?',
      meta: { isChannel: true },
    },
  ]
}

export default routes
