const { location } = window

const basePath = process.env.REACT_APP_BASE_PATH || '/'

const socketUrl =
  process.env.REACT_APP_SOCKET_URL || `${location.protocol}//${location.host}`

const socketPath = process.env.REACT_APP_SOCKET_PATH || '/socket.io'

const publicEmbedChannelName = process.env.REACT_APP_PUBLIC_EMBED_CHANNEL_NAME
const publicEmbedServerId = process.env.REACT_APP_PUBLIC_EMBED_SERVER_ID
const isPublicEmbed = !!(publicEmbedChannelName && publicEmbedServerId)

const config = {
  basePath,
  socketUrl,
  socketPath,
  publicEmbedChannelName,
  publicEmbedServerId,
  isPublicEmbed,
}

export default config
