const fs = require('fs')

const _ = require('lodash')
const KoaRouter = require('koa-router')
const escapeHtml = require('escape-html')

const { isUuid } = require('../../../common/src/utils')
const titles = require('../../../common/src/titles')

const config = require('../config')
const logger = require('../logger')
const { getMessage } = require('../rethink/queries')
const { versionText } = require('../version')
const { searchMessages } = require('../elastic/queries')

const router = new KoaRouter()

const getClientPath = ctx => {
  if (_.isString(config.http.clientPath)) {
    return config.http.clientPath
  }

  return config.http.clientPath[
    ctx.request.headers['x-client-app']
  ]
}

router.get('/api/version', ctx => {
  ctx.body = { version: versionText }
})

router.get('/api/search', async ctx => {
  const { query } = ctx.request
  const { channel, offset } = ctx.request.query

  ctx.body = await searchMessages(channel, query, offset)
})

router.get('/:messageId', async (ctx) => {
  let clientPath = getClientPath(ctx)

  if (!clientPath) {
    logger.warn('Could not detect clientPath!')
    return
  }

  const indexPath = `${clientPath}/index.html`

  let indexHtml
  try {
    indexHtml = fs.readFileSync(indexPath, 'utf8')
  } catch (e) {
    logger.warn(`Could not find '${indexPath}'!`)
    return
  }

  if (isUuid(ctx.params.messageId)) {
    const message = await getMessage(ctx.params.messageId)

    if (message) {
      const title = titles.getMessageTitle(message)

      indexHtml = indexHtml.replace(
        '<title>msks</title>',
        `<title>${escapeHtml(title)}</title>`
      )
    }
  }

  ctx.body = indexHtml
})

module.exports = router
