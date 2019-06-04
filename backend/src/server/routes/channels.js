const KoaRouter = require('koa-router')

const store = require('../../store')
const {
  createAccountChannelsSelector,
  publicChannelsSelector,
} = require('../../store/selectors/channels')
const withChannel = require('../middlewares/withChannel')
const { broadcastChannel } = require('../socket/broadcasters')

const router = new KoaRouter()

router.get('/', async ctx => {
  const { account } = ctx

  const state = store.getState()

  ctx.body = {
    channels: account
      ? createAccountChannelsSelector(account.id)(state)
      : publicChannelsSelector(state),
  }
})

router.put('/read', withChannel, async ctx => {
  const { channel } = ctx

  store.dispatch({
    type: 'RESET_UNREAD',
    payload: {
      channelId: channel.id,
    },
  })

  broadcastChannel({
    next: channel,
  })

  ctx.body = {}
})

module.exports = router
