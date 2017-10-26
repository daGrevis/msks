const { matchCommand, onPing } = require('./commands')
const { ircClient } = require('./index')

ircClient.user.nick = 'msks'

describe('matchCommand resolving to command', () => {
  const expectation = message => {
    const match = matchCommand(message)
    return expect(match ? match.fn : match)
  }
  const itWillMatchPing = message => {
    const description = (
      `will match \`${message.text}\``
      + (message.to ? ` to ${message.to}` : '')
    )
    it(description, () => {
      expectation(message).toEqual(onPing)
    })
  }
  const itWontMatchPing = message => {
    const description = (
      `wont match \`${message.text}\``
      + (message.to ? ` to ${message.to}` : '')
    )
    it(description, () => {
      expectation(message).not.toEqual(onPing)
    })
  }

  itWillMatchPing({ text: '!ping' })
  itWillMatchPing({ text: ',ping' })
  itWillMatchPing({ text: 'msks, ping' })
  itWillMatchPing({ text: 'msks, !ping' })
  itWillMatchPing({ text: 'msks, ,ping' })
  itWillMatchPing({ text: 'ping', to: 'msks' })
  itWillMatchPing({ text: 'msks, ping', to: 'msks' })
  itWillMatchPing({ text: 'msks, !ping', to: 'msks' })

  itWontMatchPing({ text: 'hello' })
  itWontMatchPing({ text: 'pls ping' })
  itWontMatchPing({ text: 'sudo !ping' })
  itWontMatchPing({ text: 'pingerino' })
  itWontMatchPing({ text: 'msks,!ping' })
  itWontMatchPing({ text: 'msks,ping' })
  itWontMatchPing({ text: 'msks,,ping' })
  itWontMatchPing({ text: 'msks, pingg' })
  itWontMatchPing({ text: 'ping', to: '#developerslv' })
})

describe('matchCommand resolving to command context', () => {
  it('will return same message', () => {
    const message = { text: 'msks, ping' }
    expect(matchCommand(message).context.message).toEqual(message)
  })

  it('will match command input', () => {
    expect(matchCommand({ text: '!echo 42' }).context.input).toEqual('42')
  })
})
