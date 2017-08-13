const repl = require('repl')

const r = require('./rethink')
const elastic = require('./elastic')
const { ircClient } = require('./irc')

const nodeRepl = repl.start()

Object.assign(nodeRepl.context, {
  r,
  elastic,
  ircClient,
})
