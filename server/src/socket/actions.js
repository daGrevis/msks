const r = require('../rethink')
const api = require('../api')

const subscribeToChannels = () => async ({ dispatch, onDisconnect }) => {
  const changefeed = await (
    r.table('channels')
    .changes({ includeInitial: true })
    .run()
  )

  let changes = []

  changefeed.each((err, change) => {
    if (err) {
      throw err
    }

    changes.push(change)
  })

  const interval = setInterval(() => {
    if (!changes.length) {
      return
    }

    dispatch({
      type: 'client/CHANNEL_CHANGES',
      payload: {
        changes,
      },
    })

    changes = []
  }, 100)

  onDisconnect(() => {
    changefeed.close()
    clearInterval(interval)
  })
}

const subscribeToUsers = ({ channelName }) => async ({ dispatch, onDisconnect }) => {
  if (!channelName) {
    console.error('SUBSCRIBE_TO_USERS: channelName missing!')
    return
  }

  const changefeed = await (
    r.table('users')
    .getAll(channelName, { index: 'channel' })
    .changes({ includeInitial: true })
    .run()
  )

  let changes = []

  changefeed.each((err, change) => {
    if (err) {
      throw err
    }

    changes.push(change)
  })

  const interval = setInterval(() => {
    if (!changes.length) {
      return
    }

    dispatch({
      type: 'client/USER_CHANGES',
      payload: {
        channelName,
        changes,
      },
    })

    changes = []
  }, 100)

  onDisconnect(() => {
    changefeed.close()
    clearInterval(interval)
  })
}

const subscribeToMessages = payload => async ({ dispatch, onDisconnect }) => {
  const { channelName } = payload

  if (!channelName) {
    console.error('SUBSCRIBE_TO_MESSAGES: channelName missing!')
    return
  }

  const changefeed = await (
    r.table('messages')
    .getAll(channelName, { index: 'to' })
    .changes()
    .run()
  )

  changefeed.each((err, change) => {
    if (err) {
      throw err
    }

    if (!change.old_val) {
      dispatch({
        type: 'client/ADD_MESSAGE',
        payload: change.new_val,
      })
    }
  })

  onDisconnect(() => {
    changefeed.close()
  })
}

module.exports = {
  subscribeToChannels,
  subscribeToUsers,
  subscribeToMessages,
}
