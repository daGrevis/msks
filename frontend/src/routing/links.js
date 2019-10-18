import _ from 'lodash'
import fp from 'lodash/fp'

import config from '../env/config'
import store from '../store'

const buildLink = parts => {
  const normalizedParts = fp.compact(
    fp.map(part => _.trimStart(part, '/'), parts),
  )

  return '/' + normalizedParts.join('/')
}

const getLinkToFront = () => '/'

const getLinkToLogin = () => `${getLinkToFront()}?login`

const getLinkToChannel = (serverId, nick, channelName) => {
  if (config.isPublicEmbed) {
    return '/'
  }

  const state = store.getState()

  const hasSingleConnection = fp.size(state.connections) === 1

  return buildLink(
    fp.concat(
      hasSingleConnection ? [serverId] : [serverId, nick],
      channelName.replace(/#/g, '~'),
    ),
  )
}

const getLinkToMessage = (serverId, nick, channelName, messageId) =>
  buildLink([getLinkToChannel(serverId, nick, channelName), messageId])

const getLinkToSearch = (serverId, nick, channelName) =>
  `${buildLink([getLinkToChannel(serverId, nick, channelName)])}?search`

const getLinkToSearchUser = (serverId, nick, channelName, searchNick) =>
  `${getLinkToSearch(serverId, nick, channelName)}&nick=${searchNick}`

const withBasePath = link => `${config.basePath}${link.slice(1)}`

export {
  getLinkToFront,
  getLinkToLogin,
  getLinkToChannel,
  getLinkToMessage,
  getLinkToSearch,
  getLinkToSearchUser,
  withBasePath,
}
