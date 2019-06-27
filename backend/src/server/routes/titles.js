const fs = require('fs')

const _ = require('lodash')
const fp = require('lodash/fp')
const KoaRouter = require('koa-router')
const escapeHtml = require('escape-html')

const titles = require('../../env/titles')
const config = require('../../env/config')
const logger = require('../../env/logger')
const isUuid = require('../../utils/isUuid')
const store = require('../../store')
const { getMessage } = require('../../postgres/queries/messages')

const router = new KoaRouter()

router.get('/*', async (ctx, next) => {
  const params = ctx.params[0].split('/')

  const clientPath = _.isObject(config.http.clientPath)
    ? config.http.clientPath[ctx.request.headers['x-client-app']]
    : config.http.clientPath

  if (!clientPath) {
    return next()
  }

  const indexPath = `${clientPath}/index.html`

  let indexHtml
  try {
    indexHtml = fs.readFileSync(indexPath, 'utf8')
  } catch (e) {
    logger.warn(`Could not find '${indexPath}'!`)
    return next()
  }

  const lastParam = fp.last(params)
  const messageId = isUuid(lastParam) ? lastParam : undefined

  let title

  if (messageId) {
    const message = await getMessage(messageId)

    if (message) {
      const state = store.getState()

      const messageChannel = state.channels[message.channelId]

      if (messageChannel.isPublic) {
        title = titles.getMessageTitle(message)
      }
    }
  }

  if (!title && params.length >= 2) {
    const hasNick = params.length === 4 || (params.length === 3 && !messageId)

    const serverId = params[0]
    const nick = hasNick ? params[1] : undefined
    const channelName = hasNick ? params[2] : params[1]

    title = titles.getChannelTitle(serverId, nick, channelName)
  }

  if (title) {
    indexHtml = indexHtml.replace(
      '<title>msks</title>',
      `<title>${escapeHtml(title)}</title>`,
    )
  }

  ctx.body = indexHtml
})

module.exports = router
