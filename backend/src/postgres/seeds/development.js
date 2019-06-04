const _ = require('lodash')
const uuidv4 = require('uuid/v4')
const addMilliseconds = require('date-fns/add_milliseconds')
const subMilliseconds = require('date-fns/sub_milliseconds')

exports.seed = async knex => {
  const now = new Date()

  let dateCounter = 0
  const getCurrentDate = () => {
    const uniqueDate = addMilliseconds(now, dateCounter)
    return uniqueDate
  }
  const getUniqueDate = () => {
    dateCounter += 1
    return getCurrentDate()
  }

  const daGrevisAccountId = 'faceb00c-0000-0000-0000-000000000000'
  const msksDevConnectionId = 'deadc0de-0000-0000-0000-000000000000'
  const siverGadConnectionId = 'b16b00b5-0000-0000-0000-000000000000'
  const siverGadServerChannelId = 'cafedaff-0000-0000-0000-000000000000'
  const publicMeeseekeriaChannelId = 'deedfeed-0000-0000-0000-000000000000'
  const siverGadMeeseekeriaChannelId = uuidv4()
  const siverGadMeeseekeria2ChannelId = uuidv4()
  const siverGadDaGrevisChannelId = uuidv4()

  await knex('accounts').insert([
    {
      id: daGrevisAccountId,
      createdAt: getUniqueDate(),
      username: 'daGrevis',
      hashedPassword:
        '$2b$10$T0R/COrdem7pjS.6zktqbeOJJ5344/PbonNad2unT3y6iSAOh4HZ6', // hunter2
    },
  ])

  await knex('connections').insert([
    {
      id: msksDevConnectionId,
      createdAt: getUniqueDate(),
      accountId: daGrevisAccountId,
      serverId: 'freenode',
      isBot: true,
      nick: 'msks-dev',
      host: 'chat.freenode.net',
      port: 6697,
      autoConnect: false,
    },
    {
      id: siverGadConnectionId,
      createdAt: getUniqueDate(),
      accountId: daGrevisAccountId,
      serverId: 'freenode',
      nick: 'siverGad',
      host: 'chat.freenode.net',
      port: 6697,
      autoConnect: false,
    },
  ])

  await knex('channels').insert([
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      connectionId: msksDevConnectionId,
      name: '*',
      type: 'server',
    },
    {
      id: siverGadServerChannelId,
      createdAt: getUniqueDate(),
      connectionId: siverGadConnectionId,
      name: '*',
      type: 'server',
    },
    {
      id: publicMeeseekeriaChannelId,
      createdAt: getUniqueDate(),
      connectionId: msksDevConnectionId,
      name: '#meeseekeria',
      type: 'shared',
      isPublic: true,
      autoJoin: true,
      topic: 'msks is short for meeseeks',
    },
    {
      id: siverGadMeeseekeriaChannelId,
      createdAt: getUniqueDate(),
      connectionId: siverGadConnectionId,
      name: '#meeseekeria',
      type: 'shared',
      autoJoin: true,
      topic: 'msks is short for meeseeks',
    },
    {
      id: siverGadMeeseekeria2ChannelId,
      createdAt: getUniqueDate(),
      connectionId: siverGadConnectionId,
      name: '#meeseekeria2',
      type: 'shared',
      autoJoin: true,
    },
    {
      id: siverGadDaGrevisChannelId,
      createdAt: getUniqueDate(),
      connectionId: siverGadConnectionId,
      name: 'daGrevis',
      type: 'user',
    },
  ])

  await knex('messages').insert(
    _.map(_.range(1, 1001), messageNumber => ({
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
      type: 'text',
      text: `#${messageNumber}`,
    })),
  )

  await knex('messages').insert(
    _.map(['a', 'b', 'c'], text => ({
      id: uuidv4(),
      createdAt: subMilliseconds(getCurrentDate(), 100),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'text',
      text,
    })),
  )

  await knex('messages').insert([
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'text',
      text: 'First!',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
      type: 'join',
      text: '',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'join',
      text: '',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'text',
      text: 'Welcome to public #meeseekeria!',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'action',
      text: 'waves',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'notice',
      text: 'some very important notice',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
      type: 'part',
      text: '',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
      type: 'join',
      text: '',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
      type: 'nick',
      text: '',
      meta: JSON.stringify({
        newNick: 'msks-dev2',
      }),
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev2',
      type: 'quit',
      text: '',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
      type: 'join',
      text: '',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'topic',
      text: 'msks is short for meeseeks',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'mode',
      text: 'siverGad set +v on msks-dev',
      meta: JSON.stringify({
        mode: '+v',
        param: 'msks-dev',
        isVoiced: true,
      }),
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'mode',
      text: 'siverGad set -b on *!~ij@NixOS/user/siers',
      meta: JSON.stringify({
        mode: '-b',
        param: '*!~ij@NixOS/user/siers',
      }),
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'kick',
      text: 'just a test',
      meta: JSON.stringify({
        kicked: 'msks-dev',
        isVoiced: true,
      }),
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
      type: 'join',
      text: '',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'text',
      text: '\u0002bold\u0002 \u001ditalic\u001d \u001funderline\u001f',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'text',
      text:
        '\u0002\u00034r\u00037a\u00038i\u00039n\u00033b\u000312o\u00036w\u0002',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
      type: 'text',
      text: 'msks-dev, ping',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
      type: 'text',
      text: 'pong',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadMeeseekeria2ChannelId,
      nick: 'siverGad',
      type: 'text',
      text: 'This channel is not public.',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadServerChannelId,
      nick: 'moon.freenode.net',
      type: 'status',
      text: 'Connecting as siverGad',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadServerChannelId,
      nick: 'siverGad',
      type: 'banlist',
      text: '',
      meta: {
        channelName: '#developerslv',
        bans: [
          {
            author: 'siers!~ij@NixOS/user/siers',
            target: '*!~ij@NixOS/user/siers',
            timestamp: 1553607589,
          },
        ],
      },
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadServerChannelId,
      nick: 'moon.freenode.net',
      type: 'status',
      text: 'Disconnected as daGrevis',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadDaGrevisChannelId,
      nick: 'daGrevis',
      type: 'text',
      text: 'Hello, siverGad',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadDaGrevisChannelId,
      nick: 'siverGad',
      type: 'text',
      text: 'Hi, daGrevis - I am /whois-ing you',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadDaGrevisChannelId,
      nick: 'daGrevis',
      type: 'whois',
      text: '',
      meta: {
        account: 'daGrevis',
        ident: '~daGrevis',
        hostname: 'unaffiliated/dagrevis',
        realName: 'Raitis Stengrevics',
        server: 'weber.freenode.net',
        serverInfo: 'US',
        secure: true,
      },
    },
  ])

  await knex('users').insert([
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'msks-dev',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: publicMeeseekeriaChannelId,
      nick: 'siverGad',
    },
    {
      id: uuidv4(),
      createdAt: getUniqueDate(),
      channelId: siverGadMeeseekeria2ChannelId,
      nick: 'siverGad',
    },
  ])
}
