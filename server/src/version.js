const fs = require('fs')

const logger = require('./logger')

const REPO_LINK = 'https://github.com/daGrevis/msks'

function getVersion() {
  const versionPath = '../VERSION'

  let output
  try {
    output = fs.readFileSync(versionPath, 'utf8')
  } catch (err) {
    logger.warn(`Could not find ${versionPath}!`)
    return
  }

  const [rev, currentTag, recentTag, subject, date] = output.split('\n')

  return { rev, currentTag, recentTag, subject, date }
}

function formatVersion(version) {
  if (!version) {
    return `msks, ${REPO_LINK}`
  }

  const { rev, currentTag, recentTag, subject, date } = version
  return (
    'Running ' +
    (
      currentTag !== 'undefined'
      ? `${currentTag}@${rev.slice(0, 7)}`
      : recentTag
    ) +
    `: "${subject}" of ${date}, ${REPO_LINK}`
  )
}

const version = getVersion()
const versionText = formatVersion(version)

module.exports = {
  version,
  versionText,
}
