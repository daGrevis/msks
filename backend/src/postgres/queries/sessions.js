const postgres = require('..')

const createSession = async session => {
  await postgres('sessions').insert(session)
  return session
}

const getSession = async sessionId =>
  postgres('sessions')
    .where({ id: sessionId })
    .first()

module.exports = {
  createSession,
  getSession,
}
