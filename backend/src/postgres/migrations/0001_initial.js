const CHANNEL_TYPES = ['server', 'shared', 'user']

const MESSAGE_TYPES = [
  'text',
  'notice',
  'action',
  'join',
  'quit',
  'part',
  'kick',
  'nick',
  'topic',
  'mode',
  'status',
  'banlist',
  'whois',
]

exports.up = async knex => {
  await knex.schema.raw('CREATE EXTENSION IF NOT EXISTS zombodb')

  await knex.schema.createTable('accounts', table => {
    table.uuid('id').primary()
    table
      .timestamp('createdAt')
      .notNullable()
      .index()
    table.string('username').notNullable()
    table.unique('username')
    table.string('hashedPassword').notNullable()
  })

  await knex.schema.createTable('sessions', table => {
    table.uuid('id').primary()
    table
      .timestamp('createdAt')
      .notNullable()
      .index()
    table.uuid('accountId').notNullable()
    table.foreign('accountId').references('accounts.id')
    table.string('token').notNullable()
  })

  await knex.schema.createTable('connections', table => {
    table.uuid('id').primary()
    table
      .timestamp('createdAt')
      .notNullable()
      .index()
    table.uuid('accountId').notNullable()
    table.foreign('accountId').references('accounts.id')
    table.string('serverId').notNullable()
    table.string('nick').notNullable()
    table.unique(['serverId', 'nick'])
    table
      .boolean('isBot')
      .notNullable()
      .defaultTo(false)
    table.string('host').notNullable()
    table.integer('port').notNullable()
    table
      .boolean('autoConnect')
      .notNullable()
      .defaultTo(false)
    table
      .boolean('tls')
      .notNullable()
      .defaultTo(true)
    table.string('username')
    table.string('password')
    table.string('gecos')
  })

  await knex.schema.createTable('channels', table => {
    table.uuid('id').primary()
    table
      .timestamp('createdAt')
      .notNullable()
      .index()
    table.uuid('connectionId').notNullable()
    table.foreign('connectionId').references('connections.id')
    table.string('name').notNullable()
    table.unique(['connectionId', 'name'])
    table.enu('type', CHANNEL_TYPES).notNullable()
    table
      .boolean('isPublic')
      .notNullable()
      .defaultTo(false)
    table
      .boolean('autoJoin')
      .notNullable()
      .defaultTo(false)
    table
      .boolean('isHidden')
      .notNullable()
      .defaultTo(false)
    table
      .boolean('isBotSilent')
      .notNullable()
      .defaultTo(false)
    table.string('topic', 1000)
  })

  await knex.schema.createTable('users', table => {
    table.uuid('id').primary()
    table
      .timestamp('createdAt')
      .notNullable()
      .index()
    table.uuid('channelId').notNullable()
    table.foreign('channelId').references('channels.id')
    table.string('nick').notNullable()
    table.unique(['channelId', 'nick'])
    table
      .boolean('isOp')
      .notNullable()
      .defaultTo(false)
    table
      .boolean('isVoiced')
      .notNullable()
      .defaultTo(false)
  })

  await knex.schema.createTable('messages', table => {
    table.uuid('id').primary()
    table
      .timestamp('createdAt')
      .notNullable()
      .index()
    table.uuid('channelId').notNullable()
    table.foreign('channelId').references('channels.id')
    table.string('nick').notNullable()
    table.enu('type', MESSAGE_TYPES).notNullable()
    table.specificType('text', 'zdb.fulltext').notNullable()
    table
      .boolean('isOp')
      .notNullable()
      .defaultTo(false)
    table
      .boolean('isVoiced')
      .notNullable()
      .defaultTo(false)
    table.jsonb('meta')
  })

  await knex.schema.raw(
    `
    CREATE TYPE messages_zombo_idx_type AS (
      id uuid,
      nick varchar,
      type varchar,
      text text
    )
  `,
  )

  await knex.schema.raw(
    `
    CREATE INDEX "messages_zombo" ON "messages"
    USING zombodb ((
      ROW(id, nick, type, text)::messages_zombo_idx_type
    ))
    WITH (url='http://elastic:9200/')
  `,
  )
}

exports.down = async knex => {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'Not running this migration on production as it will wipe out the database!',
    )
    process.exit(-1)
  }

  await knex.schema.dropTable('messages')

  await knex.schema.raw('DROP TYPE messages_zombo_idx_type')

  await knex.schema.dropTable('users')

  await knex.schema.dropTable('channels')

  await knex.schema.dropTable('connections')

  await knex.schema.dropTable('sessions')

  await knex.schema.dropTable('accounts')
}
