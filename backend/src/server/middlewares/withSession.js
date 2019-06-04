const HttpStatus = require('http-status-codes')

const { getSession } = require('../../postgres/queries/sessions')
const { getAccount } = require('../../postgres/queries/accounts')

const withSession = () => async (ctx, next) => {
  const sessionId = ctx.request.header['x-session-id']
  const token = ctx.request.header['x-token']

  // Continue without authenticating session.
  if (!sessionId || !token) {
    return next()
  }

  const session = await getSession(sessionId)

  if (!session || session.token !== token) {
    ctx.body = { error: 'Invalid token!' }
    ctx.status = HttpStatus.UNAUTHORIZED
    return
  }

  const account = await getAccount(session.accountId)

  if (!account) {
    ctx.body = { error: 'Account not found!' }
    ctx.status = HttpStatus.NOT_FOUND
    return
  }

  ctx.session = session
  ctx.account = account
  return next()
}

module.exports = withSession
