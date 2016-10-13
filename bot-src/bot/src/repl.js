const repl = require('repl')

const r = require('./rethink')
const schemas = require('./schemas')

const nodeRepl = repl.start()

nodeRepl.context.r = r
nodeRepl.context.schemas = schemas
