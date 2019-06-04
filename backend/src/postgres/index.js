const knex = require('knex')

const knexfile = require('./knexfile')

const postgres = knex(knexfile)

module.exports = postgres
