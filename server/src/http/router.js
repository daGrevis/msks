const fs = require('fs')

const fp = require('lodash/fp')
const KoaRouter = require('koa-router')
const escapeHtml = require('escape-html')

const { isUuid } = require('../../../common/src/utils')
const titles = require('../../../common/src/titles')

const config = require('../config')
const logger = require('../logger')
const api = require('../api')
const commands = require('../irc/commands')
const rethinkQueries = require('../rethink/queries')

const router = new KoaRouter()

const getClientPath = ctx => {
  if (fp.isString(config.http.clientPath)) {
    return config.http.clientPath
  }

  return config.http.clientPath[
    ctx.request.headers['x-client-app']
  ]
}

router.get('/api/commands/ping', async ctx => {
  ctx.body = await commands.onPing()
})

router.get('/api/commands/echo/:params?', async ctx => {
  ctx.body = await commands.onEcho({ params: ctx.params.params || '' })
})

router.get('/api/commands/uptime', async ctx => {
  ctx.body = await commands.onUptime()
})

router.get('/api/commands/version', async ctx => {
  ctx.body = await commands.onVersion()
})

router.get('/api/channels', async ctx => {
  ctx.body = await api.getChannels()
})

router.get('/api/users', async ctx => {
  ctx.body = await api.getUsers(ctx.request.query.channel, ctx.request.query.nick)
})

router.get('/api/messages', async ctx => {
  ctx.body = await api.getMessages(
    ctx.request.query.channel,
    ctx.request.query.limit || 100
  )
})

router.get('/api/messages/before/:messageId', async ctx => {
  ctx.body = await api.getMessagesBefore(
    ctx.params.messageId,
    ctx.request.query.limit || 100
  )
})

router.get('/api/messages/after/:messageId', async ctx => {
  ctx.body = await api.getMessagesAfter(
    ctx.params.messageId,
    ctx.request.query.limit || 100
  )
})

router.get('/api/messages/around/:messageId', async ctx => {
  ctx.body = await api.getMessagesAround(
    ctx.params.messageId,
    ctx.request.query.limit || 150
  )
})

router.get('/api/messages/search', async ctx => {
  ctx.body = await api.searchMessages(
    ctx.request.query.channel,
    fp.omit(['channel', 'limit', 'offset'], ctx.request.query),
    ctx.request.query.limit || 50,
    ctx.request.query.messageId
  )
})

router.get('/api/messages/:messageId', async ctx => {
  ctx.body = await api.getMessage(ctx.params.messageId)
})

router.get('/:messageId', async (ctx, next) => {
  if (!isUuid(ctx.params.messageId)) {
    return next()
  }
  let clientPath = getClientPath(ctx)

  if (!clientPath) {
    logger.warn('Could not detect clientPath!')
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

  const message = await rethinkQueries.getMessage(ctx.params.messageId)

  if (!message) {
    return next()
  }

  const title = titles.getMessageTitle(message)

  indexHtml = indexHtml.replace(
    '<title>msks</title>',
    `<title>${escapeHtml(title)}</title>`
  )

  ctx.body = indexHtml
})

module.exports = router
