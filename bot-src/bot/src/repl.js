const repl = require('repl')

const r = require('./rethink')
const schemas = require('./schemas')
const client = require('./index')

const nodeRepl = repl.start()

nodeRepl.context.r = r
nodeRepl.context.schemas = schemas
nodeRepl.context.client = client
