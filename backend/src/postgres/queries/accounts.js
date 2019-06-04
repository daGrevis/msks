const postgres = require('..')

const createAccount = async account => {
  await postgres('accounts').insert(account)
  return account
}

const getAccount = async id =>
  postgres('accounts')
    .where({ id })
    .first()

const getAccountByUsername = async username =>
  postgres('accounts')
    .where({ username })
    .first()

module.exports = {
  createAccount,
  getAccount,
  getAccountByUsername,
}
