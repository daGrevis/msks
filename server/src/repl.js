const repl = require('repl')

const r = require('./rethink')
const queries = require('./queries')
const { validate } = require('./schemas')
const schemas = require('./schemas')
const client = require('./index')

const nodeRepl = repl.start()

nodeRepl.context.r = r
nodeRepl.context.queries = queries
nodeRepl.context.validate = validate
nodeRepl.context.schemas = schemas
nodeRepl.context.client = client
