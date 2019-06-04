// eslint-disable-next-line import/no-extraneous-dependencies
const proxy = require('http-proxy-middleware')

module.exports = app => {
  app.use(proxy('/api', { target: 'http://localhost:3001/' }))
  app.use(
    proxy('/socket.io', { target: 'ws://localhost:3001/socket.io', ws: true }),
  )
}
