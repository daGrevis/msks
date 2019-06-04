const postgres = require('..')

const createChannel = async channel => {
  await postgres('channels').insert(channel)
  return channel
}

const updateChannel = async (params, data) => {
  const channels = await postgres('channels')
    .where(params)
    .update(data)
    .limit(1)
    .returning('*')
  return channels[0]
}

const getChannels = async () => postgres('channels')

module.exports = {
  createChannel,
  updateChannel,
  getChannels,
}
