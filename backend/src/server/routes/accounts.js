const fp = require('lodash/fp')
const KoaRouter = require('koa-router')
const HttpStatus = require('http-status-codes')
const bcrypt = require('bcryptjs')
const uuidv4 = require('uuid/v4')

const { createAccount } = require('../../postgres/queries/accounts')

const router = new KoaRouter()

router.post('/', async ctx => {
  const { username, password } = ctx.request.body

  if (!username || !password) {
    ctx.body = { error: 'Username or password missing!' }
    ctx.status = HttpStatus.BAD_REQUEST
    return
  }

  const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10))

  const account = await createAccount({
    id: uuidv4(),
    createdAt: new Date(),
    username,
    hashedPassword,
  })

  ctx.body = fp.omit('hashedPassword', account)
  ctx.status = HttpStatus.CREATED
})

module.exports = router
