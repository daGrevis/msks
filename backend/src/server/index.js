const http = require('http')

const Koa = require('koa')
const koaCors = require('@koa/cors')
const koaBody = require('koa-body')
const KoaRouter = require('koa-router')

const config = require('../env/config')
const withLogger = require('./middlewares/withLogger')
const withSession = require('./middlewares/withSession')
const messagesRouter = require('./routes/messages')
const channelsRouter = require('./routes/channels')
const usersRouter = require('./routes/users')
const accountsRouter = require('./routes/accounts')
const sessionsRouter = require('./routes/sessions')
const commandsRouter = require('./routes/commands')
const titlesRouter = require('./routes/titles')
const socket = require('./socket')

const koa = new Koa()

if (config.http.cors) {
  koa.use(koaCors(config.http.cors))
}

koa.use(koaBody())

koa.use(withLogger())

koa.use(withSession())

const router = new KoaRouter()
router.use('/api/messages', messagesRouter.routes())
router.use('/api/channels', channelsRouter.routes())
router.use('/api/users', usersRouter.routes())
router.use('/api/accounts', accountsRouter.routes())
router.use('/api/sessions', sessionsRouter.routes())
router.use('/api/commands', commandsRouter.routes())
router.use(titlesRouter.routes())

koa.use(router.routes())
koa.use(router.allowedMethods())

const server = http.createServer(koa.callback())

socket.attach(server)

module.exports = server
