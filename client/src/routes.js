import config from './config'

let routes

if (config.embedChannel) {
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
      path: '/:channelName',
      meta: { isChannel: true },
    },
    {
      path: '/:channelName/:messageId',
      meta: { isChannel: true },
    },
  ]
}

export default routes
