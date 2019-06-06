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
    const [rev, currentTag, recentTag, subject, date] = versionData.split('\n')

    response =
      'Running ' +
      (currentTag !== 'undefined'
        ? `${currentTag}@${rev.slice(0, 7)}`
        : recentTag) +
      `: "${subject}" of ${date}, ${REPO_LINK}`
  }

  say(ircClient, {
    target: channelName,
    message: response,
  })
}

module.exports = version
