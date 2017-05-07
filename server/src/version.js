const fs = require('fs')

const REPO_LINK = 'https://github.com/daGrevis/msks-bot'

function getVersion() {
  let output
  try {
    output = fs.readFileSync('VERSION', 'utf8')
  } catch (err) {
    return undefined
  }

  const [rev, tag, subject, date] = output.split('\n')

  return { rev, tag, subject, date }
}

function formatVersion(version) {
  if (!version) {
    return `msks-bot, ${REPO_LINK}`
  }

  const { tag, rev, subject, date } = version
  return (
    `msks-bot ${tag ? tag + '@' : ''}${rev.slice(0, 7)}:` +
    ` "${subject}" of ${date}, ${REPO_LINK}`
  )
}

const version = getVersion()
const versionText = formatVersion(version)

module.exports = {
  version,
  versionText,
}
