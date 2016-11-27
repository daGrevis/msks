import fp from 'lodash/fp'
import { createUpdater, pipeUpdaters } from 'redux-fp'

const initialState = {
  location: null,

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

  loadMessagesCache: [
    // ['##javascript', null],
    // ['##javascript', '2016-11-17T15:06:04.481Z'],
    // ['##javascript', '2016-11-02T10:55:24.932Z'],
    // ['#developerslv', null],
  ],

  messagesByChannel: {
    // '##javascript': {
    //   '7eec370e-36e4-496a-9dcf-390cbfa1fbe0': {
    //     'id': '7eec370e-36e4-496a-9dcf-390cbfa1fbe0',
    //     'from': 'Sorella',
    //     'to': '##javascript',
    //     'text': 'Chrome only allows up to 1GB heaps',
    //     'kind': 'message',
    //     'timestamp': '2016-11-21T21:13:44.338Z',
    //   },
    //   'd3348233-440e-4962-b60a-9fb174f75331': {
    //     'id': 'd3348233-440e-4962-b60a-9fb174f75331',
    //     'from': 'reisio',
    //     'to': '##javascript',
    //     'text': 'shrugs',
    //     'kind': 'action',
    //     'timestamp': '2016-11-21T21:13:41.985Z',
    //   },
    // },
  },

  hasReachedChannelBeginning: {
    // '#developerslv': true,
  },
}

const historyUpdater = createUpdater({
  NAVIGATED: ({ payload }) => fp.set('location', payload)
})

const channelUpdater = createUpdater({
  UPDATE_CHANNEL: ({ payload }) => fp.set(['channels', payload.name], payload),
})

const addMessage = message => fp.set(['messagesByChannel', message.to, message.id], message)

const messagesUpdater = createUpdater({
  'server/LOAD_MESSAGES': ({ payload }) => fp.update('loadMessagesCache', cache => fp.concat(cache, [[payload.channelName, payload.timestamp]])),
  ADD_MESSAGE: ({ payload }) => addMessage(payload),
  ADD_MESSAGES: ({ payload: { channelName, messages }}) => state => fp.pipe(
    state => fp.reduce((st, m) => addMessage(m)(st), state, messages),
    fp.set(['hasReachedChannelBeginning', channelName], messages.length === 1 || messages.length < 100)
  )(state),
})

const reducer = (state, action) => pipeUpdaters(
  historyUpdater,
  channelUpdater,
  messagesUpdater
)(action)(state)

export {
  initialState,
  reducer,
}
