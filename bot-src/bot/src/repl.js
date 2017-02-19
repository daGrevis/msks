const repl = require('repl')

const r = require('./rethink')
const { validate } = require('./schemas')
const schemas = require('./schemas')
const client = require('./index')

const nodeRepl = repl.start()

nodeRepl.context.r = r
nodeRepl.context.validate = validate
nodeRepl.context.schemas = schemas
nodeRepl.context.client = client
