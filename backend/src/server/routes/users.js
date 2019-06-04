const KoaRouter = require('koa-router')

const withChannel = require('../middlewares/withChannel')
const store = require('../../store')
const { createChannelUsersSelector } = require('../../store/selectors/users')

const router = new KoaRouter()

router.get('/', withChannel, async ctx => {
  const state = store.getState()

  const { channel } = ctx

  const { query } = ctx.request

  ctx.body = {
    query,
    users: createChannelUsersSelector(channel)(state),
  }
})

module.exports = router
