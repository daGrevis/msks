const ircFramework = require('irc-framework')

const config = require('./config')
const { formattedVersion } = require('./version')

const client = new ircFramework.Client({
  host: config.ircHost,
  port: config.ircPort,
  nick: config.ircNick,
  username: config.ircUsername,
  password: config.ircPassword,
  tls: config.ircTls,
  gecos: config.ircGecos,
  auto_reconnect: true,
  // Tries to reconnect for at least 5 hours.
  auto_reconnect_wait: 2000 + Math.round(Math.random() * 2000),
  auto_reconnect_max_retries: 9000,
  version: formattedVersion,
})

module.exports = client
