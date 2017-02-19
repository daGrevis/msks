const fs = require('fs')

const REPO_URL = 'https://github.com/daGrevis/msks-bot'

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
    return `msks-bot, ${REPO_URL}`
  }

  const { tag, rev, subject, date } = version
  return (
    `msks-bot ${tag ? tag + '@' : ''}${rev.slice(0, 7)}:` +
    ` "${subject}" of ${date}, ${REPO_URL}`
  )
}

const version = getVersion()
const formattedVersion = formatVersion(version)

module.exports = {
  version,
  formattedVersion,
}
