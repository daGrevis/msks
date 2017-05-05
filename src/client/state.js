const initialState = {
  isEmbed: false,

  isBroken: false,

  isVisible: true,

  location: null,

  channelName: null,

  channels: {
    // '##javascript': {
    //   'name': '##javascript',
    //   'topic': 'Can't talk? Get registered on freenode (HOWTO: https://gist.github.com/brigand/f271177642368307f051 ). | JavaScript is *not* Java. | Just ask your question. | Say \'!mdn abc\' for docs on \'abc\'. | Don't paste code in the channel.',
    // },
    // '#developerslv': {
    //   'name': '#developerslv',
    //   'topic': 'About software and hacking in Latvian. | Can't talk? Get registered on Freenode.',
    // },
  },

  users: {
    // '#developerslv': {
    //   'msks': {
    //     'id': ['#developerslv', 'msks'],
    //     'channel': '#developerslv',
    //     'nick': 'msks',
    //     'isVoiced': true,
    //   },
    //   'daGrevis': {
    //     'id': ['#developerslv', 'daGrevis'],
    //     'channel': '#developerslv',
    //     'nick': 'daGrevis',
    //     'isOp': true,
    //   },
    // },
  },

  messages: {
    // '##javascript': [
    //   {
    //     'id': '7eec370e-36e4-496a-9dcf-390cbfa1fbe0',
    //     'from': 'Sorella',
    //     'to': '##javascript',
    //     'text': 'Chrome only allows up to 1GB heaps',
    //     'kind': 'message',
    //     'timestamp': '2016-11-21T21:13:44.338Z',
    //   },
    //   {
    //     'id': 'd3348233-440e-4962-b60a-9fb174f75331',
    //     'from': 'reisio',
    //     'to': '##javascript',
    //     'text': 'shrugs',
    //     'kind': 'action',
    //     'timestamp': '2016-11-21T21:13:41.985Z',
    //   },
    // ],
  },

  isSubscribedToMessages: {
    // '#developerslv': true,
  },
  isSubscribedToUsers: {
    // '#developerslv': true,
  },

  loadCache: {
    // 'd3348233-440e-4962-b60a-9fb174f75331': true,
  },

  hasReachedBeginning: {
    // '#developerslv': true,
  },

  scrollPositions: {
    // '#developerslv': 123,
  },

  unread: 0,

  notifications: [
    // {
    //   'key': '826833f3-d75e-40f9-8bbc-cae5712a0799',
    //   'message': 'Hello, world',
    // },
  ],
}

export {
  initialState,
}
