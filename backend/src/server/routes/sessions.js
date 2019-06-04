const KoaRouter = require('koa-router')
const HttpStatus = require('http-status-codes')
const bcrypt = require('bcryptjs')
const uuidv4 = require('uuid/v4')

const { getAccountByUsername } = require('../../postgres/queries/accounts')
const { createSession } = require('../../postgres/queries/sessions')

const router = new KoaRouter()

router.post('/', async ctx => {
  const { username, password } = ctx.request.body

  if (!username || !password) {
    const errors = {}

    if (!username) {
      errors.username = 'Username is required!'
    }
    if (!password) {
      errors.password = 'Password is required!'
    }

    ctx.body = { errors }
    ctx.status = HttpStatus.BAD_REQUEST
    return
  }

  const account = await getAccountByUsername(username)

  let isPasswordValid = false
  if (account) {
    isPasswordValid = bcrypt.compareSync(password, account.hashedPassword)
  } else {
    // Always compare something to avoid detecting whether such username exists.
    bcrypt.compareSync(password, username)
  }

  if (!isPasswordValid) {
    const errors = { password: 'Password is incorrect!' }

    ctx.body = { errors }
    ctx.status = HttpStatus.UNAUTHORIZED
    return
  }

  const session = await createSession({
    id: uuidv4(),
    createdAt: new Date(),
    accountId: account.id,
    token: uuidv4(),
  })

  ctx.body = { session }
  ctx.status = HttpStatus.CREATED
})

module.exports = router
