const postgres = require('..')

const replaceUsers = async (channelId, nextUsers) =>
  postgres.transaction(async trx => {
    const prevUsers = await trx('users')
      .where({ channelId })
      .delete()
      .returning('*')

    await trx('users').insert(nextUsers)

    return prevUsers
  })

const createUser = async user => {
  await postgres('users').insert(user)
  return user
}

const updateUser = async (params, data) => {
  const users = await postgres('users')
    .where(params)
    .update(data)
    .limit(1)
    .returning('*')
  return users[0]
}

const deleteUser = async params => {
  const users = await postgres('users')
    .where(params)
    .delete()
    .limit(1)
    .returning('*')
  return users[0]
}

const getUsers = async () => postgres('users')

module.exports = {
  replaceUsers,
  createUser,
  updateUser,
  deleteUser,
  getUsers,
}
