const ping = require('./ping')
const { getCommand } = require('.')

describe('command parsing', () => {
  const connection = {
    nick: 'msks',
  }

  const itWillPong = payload => {
    const description =
      `will pong on \`${payload.message}\`` +
      (payload.target ? ` to ${payload.target}` : '')

    it(description, () => {
      expect(getCommand(connection, payload).command).toEqual(ping)
    })
  }

  const itWontPong = payload => {
    const description =
      `wont pong on \`${payload.message}\`` +
      (payload.target ? ` to ${payload.target}` : '')

    it(description, () => {
      expect(getCommand(connection, payload).command).not.toEqual(ping)
    })
  }

  itWillPong({ message: '!ping' })
  itWillPong({ message: ',ping' })
  itWillPong({ message: 'msks, ping' })
  itWillPong({ message: 'msks: ping' })
  itWillPong({ message: 'msks, ping' })
  itWillPong({ message: 'ping', target: 'msks' })

  itWontPong({ message: 'hello' })
  itWontPong({ message: 'pls ping' })
  itWontPong({ message: 'sudo !ping' })
  itWontPong({ message: 'pingerino' })
  itWontPong({ message: 'msks, !ping' })
  itWontPong({ message: 'msks, ,ping' })
  itWontPong({ message: 'msks,!ping' })
  itWontPong({ message: 'msks,ping' })
  itWontPong({ message: 'msks,,ping' })
  itWontPong({ message: 'msks, pingg' })
  itWontPong({ message: 'ping', target: '#developerslv' })

  it('will parse params', () => {
    expect(
      getCommand(connection, { message: '!echo 42' }).commandParams,
    ).toEqual('42')
  })
})
