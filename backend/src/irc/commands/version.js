const fs = require('fs')
const path = require('path')

const say = require('../say')

const REPO_LINK = 'https://github.com/daGrevis/msks'

const VERSION_PATH = path.resolve(__dirname, '../../../VERSION')

let versionData

const version = async ({ ircClient, channelName }) => {
  if (versionData === undefined) {
    try {
      versionData = fs.readFileSync(VERSION_PATH, 'utf8')
    } catch (err) {
      versionData = false
    }
  }

  let response = `msks, ${REPO_LINK}`

  if (versionData) {
    const [rev, latestTag, commitCount, subject, date] = versionData.split('\n')

    response =
      `Running \u0002${latestTag}\u0002` +
      (Number(commitCount) > 0 ? `+${commitCount}` : '') +
      `@\u0002${rev.slice(0, 7)}\u0002: ` +
      `"\u001d${subject}\u001d" of ${date}, ${REPO_LINK}`
  }

  say(ircClient, {
    target: channelName,
    message: response,
  })
}

module.exports = version
