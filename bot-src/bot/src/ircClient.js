const ircFramework = require('irc-framework')

const config = require('./config')
const { formattedVersion } = require('./version')

const client = new ircFramework.Client()

client.connect({
  host: config.ircHost,
  port: config.ircPort,
  nick: config.ircNick,
  username: config.ircUsername,
  password: config.ircPassword,
  tls: config.ircTls,
  gecos: config.ircGecos,
  auto_reconnect: true,
  auto_reconnect_wait: 1000,
  auto_reconnect_max_retries: 1000,
  version: formattedVersion,
})

module.exports = client
