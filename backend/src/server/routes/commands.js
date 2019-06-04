const fp = require('lodash/fp')
const KoaRouter = require('koa-router')
const HttpStatus = require('http-status-codes')

const store = require('../../store')
const withParamRequired = require('../middlewares/withParamRequired')
const withAuthenticated = require('../middlewares/withAuthenticated')
const withConnection = require('../middlewares/withConnection')
const withIrcClient = require('../middlewares/withIrcClient')
const withChannel = require('../middlewares/withChannel')
const { broadcastChannel } = require('../socket/broadcasters')
const { updateConnection } = require('../../postgres/queries/connections')
const { updateChannel } = require('../../postgres/queries/channels')
const say = require('../../irc/say')
const connect = require('../../irc/connect')

const router = new KoaRouter()

router.post(
  '/query',
  withAuthenticated,
  withConnection,
  withIrcClient,
  withParamRequired('channelName'),
  withParamRequired('text'),
  async ctx => {
    const state = store.getState()

    const { connection, ircClient, channelName, text } = ctx

    const channel = fp.find(
      {
        connectionId: connection.id,
        name: channelName,
      },
      state.channels,
    )

    if (channel && channel.type === 'server') {
      ctx.body = { error: "Server can't be queried!" }
      ctx.status = HttpStatus.FORBIDDEN
      return
    }

    say(ircClient, {
      target: channelName,
      message: text,
    })

    ctx.body = {}
  },
)

router.post(
  '/join',
  withAuthenticated,
  withConnection,
  withIrcClient,
  withParamRequired('channelName'),
  async ctx => {
    const { ircClient, channelName } = ctx

    ircClient.join(channelName)

    ctx.body = {}
  },
)

router.post(
  '/leave',
  withAuthenticated,
  withConnection,
  withIrcClient,
  withParamRequired('channelName'),
  async ctx => {
    const { ircClient, channelName } = ctx

    if (channelName === '*') {
      ctx.body = { error: "Can't leave server channel!" }
      ctx.status = HttpStatus.FORBIDDEN
      return
    }

    ircClient.part(channelName)

    ctx.body = {}
  },
)

router.post('/quit', withAuthenticated, withConnection, async ctx => {
  const state = store.getState()

  const { connection } = ctx

  const ircClient = state.ircClients[connection.id]

  if (!ircClient) {
    // Happens only when no connection has ever been attempted.
    // Disconnected connections are still here so it's possible
    // to call QUIT many times.
    ctx.body = { error: 'No connection to IRC server!' }
    ctx.status = HttpStatus.FORBIDDEN
    return
  }

  store.dispatch({
    type: 'SET_CONNECTION_ATTEMPT',
    payload: {
      connectionId: connection.id,
      attempt: 0,
    },
  })

  ircClient.quit()

  const nextConnection = await updateConnection(
    { id: connection.id },
    { autoConnect: false },
  )
  store.dispatch({
    type: 'SYNC_POSTGRES',
    payload: {
      table: 'connections',
      change: { next: nextConnection },
    },
  })

  ctx.body = {}
})

router.post('/connect', withAuthenticated, withConnection, async ctx => {
  const state = store.getState()

  const { connection } = ctx

  if (state.isIrcClientConnected[connection.id]) {
    ctx.body = { error: 'Already connected to IRC!' }
    ctx.status = HttpStatus.SERVICE_UNAVAILABLE
    return
  }

  const nextConnection = await updateConnection(
    { id: connection.id },
    { autoConnect: true },
  )
  store.dispatch({
    type: 'SYNC_POSTGRES',
    payload: {
      table: 'connections',
      change: { next: nextConnection },
    },
  })

  connect(nextConnection)

  ctx.body = {}
})

router.post(
  '/notice',
  withAuthenticated,
  withConnection,
  withIrcClient,
  withParamRequired('channelName'),
  withParamRequired('text'),
  async ctx => {
    const { ircClient, channelName, text } = ctx

    say(ircClient, {
      type: 'notice',
      target: channelName,
      message: text,
    })

    ctx.body = {}
  },
)

router.post(
  '/action',
  withAuthenticated,
  withConnection,
  withIrcClient,
  withChannel,
  async ctx => {
    const { ircClient, channel } = ctx
    const text = ctx.request.body.text || ''

    say(ircClient, {
      type: 'action',
      target: channel.name,
      message: text,
    })

    ctx.body = {}
  },
)

router.post(
  '/kick',
  withAuthenticated,
  withConnection,
  withIrcClient,
  withChannel,
  withParamRequired('nick'),
  async ctx => {
    const { ircClient, channel, nick } = ctx
    const text = ctx.request.body.text || ''

    ircClient.raw('KICK', channel.name, nick, text)

    ctx.body = {}
  },
)

router.post(
  '/mode',
  withAuthenticated,
  withConnection,
  withIrcClient,
  withChannel,
  withParamRequired('mode'),
  async ctx => {
    const { ircClient, channel, mode } = ctx
    const target = ctx.request.body.target || ''

    ircClient.raw('MODE', channel.name, mode, target)

    ctx.body = {}
  },
)

router.post(
  '/whois',
  withAuthenticated,
  withConnection,
  withIrcClient,
  withParamRequired('nick'),
  async ctx => {
    const { ircClient, nick } = ctx

    ircClient.whois(nick)

    ctx.body = {}
  },
)

router.post('/hide', withAuthenticated, withChannel, async ctx => {
  const state = store.getState()

  const { channel } = ctx

  if (channel.type === 'server') {
    ctx.body = { error: "Server can't be hidden!" }
    ctx.status = HttpStatus.FORBIDDEN
    return
  }

  if (channel.type === 'shared' && state.isJoinedIrcChannel[channel.id]) {
    ctx.body = { error: 'Must leave channel first!' }
    ctx.status = HttpStatus.FORBIDDEN
    return
  }

  const nextChannel = await updateChannel(
    { id: channel.id },
    { isHidden: true, autoJoin: false },
  )
  store.dispatch({
    type: 'SYNC_POSTGRES',
    payload: {
      table: 'channels',
      change: { next: nextChannel },
    },
  })

  broadcastChannel({
    next: nextChannel,
  })

  ctx.body = {}
})

module.exports = router
