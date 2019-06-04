const KoaRouter = require('koa-router')

const withChannel = require('../middlewares/withChannel')
const store = require('../../store')
const {
  createPublicChannelSelector,
} = require('../../store/selectors/channels')
const { getMessages, getMessage } = require('../../postgres/queries/messages')

const router = new KoaRouter()

router.get('/', withChannel, async ctx => {
  const { query } = ctx.request

  query.limit = +query.limit || 150

  const { channel } = ctx

  if (!channel.isPublic) {
    const state = store.getState()

    const publicChannel = createPublicChannelSelector(channel)(state)

    if (publicChannel) {
      query.publicChannelId = publicChannel.id
    }
  }

  const messages = await getMessages(query)

  ctx.body = {
    query,
    messages,
  }
})

router.get('/:messageId', async ctx => {
  const message = await getMessage(ctx.params.messageId)

  ctx.body = { message }
})

module.exports = router
