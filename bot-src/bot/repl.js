const repl = require('repl')

const db = require('./db')
const schemas = require('./schemas')

r = repl.start()

r.context.db = db
r.context.schemas = schemas
