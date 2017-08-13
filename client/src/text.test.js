import {
  parse as parseWithOpts, tokenize as tokenizeWithOpts, createToken,
  COLOR_CHAR, BOLD_CHAR, ITALIC_CHAR, UNDERLINE_CHAR, RESET_CHAR,
  colorize, bold, italic, underline, logChars,
} from './text'

const opts = { highlights: ['foo', 'bar'] }

const tokenize = tokenizeWithOpts(opts)
const parse = parseWithOpts(opts)

describe('lexer', () => {
  const s = 'hello'

  it('tokenizes text', () => {
    expect(tokenize(s))
      .toEqual([
        createToken('text', s),
      ])
  })

  it('tokenizes links', () => {
    expect(tokenize('http://dagrev.is'))
      .toEqual([
        createToken('link', 'http://dagrev.is'),
      ])

    expect(tokenize('http://dagrev.is & http://dagrevis.lv'))
      .toEqual([
        createToken('link', 'http://dagrev.is'),
        createToken('text', ' & '),
        createToken('link', 'http://dagrevis.lv'),
      ])
  })

  it('tokenizes colors', () => {
    expect(tokenize(colorize([4], s)))
      .toEqual([
        createToken('foreground', 4),
        createToken('text', s),
      ])

    expect(tokenize(colorize([4, 1], s) + ' ' + colorize([2], s)))
      .toEqual([
        createToken('foreground', 4),
        createToken('background', 1),
        createToken('text', s + ' '),
        createToken('foreground', 2),
        createToken('text', s),
      ])
  })

  it('tokenizes resets', () => {
    expect(tokenize(s + RESET_CHAR))
      .toEqual([
        createToken('text', s),
        createToken('reset'),
      ])

    expect(tokenize(colorize([4], s) + RESET_CHAR + ' world'))
      .toEqual([
        createToken('foreground', 4),
        createToken('text', s),
        createToken('reset'),
        createToken('text', ' world'),
      ])
  })

  it('tokenizes styles', () => {
    expect(tokenize(bold(s)))
      .toEqual([
        createToken('bold'),
        createToken('text', s),
        createToken('bold'),
      ])

    expect(tokenize(`${bold('bold')}, ${italic('italic')} & ${underline('underline')}`))
      .toEqual([
        createToken('bold'),
        createToken('text', 'bold'),
        createToken('bold'),
        createToken('text', ', '),
        createToken('italic'),
        createToken('text', 'italic'),
        createToken('italic'),
        createToken('text', ' & '),
        createToken('underline'),
        createToken('text', 'underline'),
        createToken('underline'),
      ])
  })

  it('tokenizes highlights', () => {
    expect(tokenize('Foo and BAR'))
      .toEqual([
        createToken('highlight', 'Foo'),
        createToken('text', ' and '),
        createToken('highlight', 'BAR'),
      ])
  })
})

describe('parser', () => {
  it('parses text', () => {
    expect(parse('hello'))
      .toEqual([{ text: 'hello' }])
  })

  it('parses bold', () => {
    expect(parse(bold('hello')))
      .toEqual([{ text: 'hello', styles: ['bold'] }])
  })

  it('parses italic', () => {
    expect(parse(italic('hello')))
      .toEqual([{ text: 'hello', styles: ['italic'] }])
  })

  it('parses underline', () => {
    expect(parse(underline('hello')))
      .toEqual([{ text: 'hello', styles: ['underline'] }])
  })

  it('parses bold/italic', () => {
    expect(parse(bold(italic('hello'))))
      .toEqual([{ text: 'hello', styles: ['bold', 'italic'] }])
  })

  it('parses bold/italic & underline', () => {
    expect(parse(`${bold(italic('hello'))} ${underline('world')}`))
      .toEqual([
        { text: 'hello', styles: ['bold', 'italic'] },
        { text: ' ' },
        { text: 'world', styles: ['underline'] },
      ])
  })

  it('parses bold & more bold', () => {
    expect(parse(`${bold('bold')} & ${bold('more bold')}`))
      .toEqual([
        { text: 'bold', styles: ['bold'] },
        { text: ' & ' },
        { text: 'more bold', styles: ['bold'] },
      ])
  })

  it('parses foreground', () => {
    expect(parse(colorize([4], 'hello')))
      .toEqual([{ text: 'hello', foreground: 4 }])
  })

  it('parses foreground & background', () => {
    expect(parse(colorize([4, 7], 'hello')))
      .toEqual([{ text: 'hello', foreground: 4, background: 7 }])
  })

  it('parses rgb', () => {
    const s = (
      colorize([4], 'r') + colorize([3], 'g') + colorize([2], 'b')
    )
    expect(parse(s))
      .toEqual([
        { text: 'r', foreground: 4 },
        { text: 'g', foreground: 3 },
        { text: 'b', foreground: 2 },
      ])
  })

  it('parses foreground & bold', () => {
    expect(parse(colorize([4], bold('hello'))))
      .toEqual([{ text: 'hello', foreground: 4, styles: ['bold'] }])
  })

  it('parses link', () => {
    expect(parse('https://developers.lv/')).toEqual([
      { text: 'https://developers.lv/', isLink: true },
    ])
  })

  it('parses bold, red link', () => {
    const link = 'http://dagrev.is/'
    const s = `blog at ${bold(colorize([4], link))}`
    expect(parse(s)).toEqual([
      { text: 'blog at ' },
      { text: link, isLink: true, foreground: 4, styles: ['bold'] },
    ])
  })

  it('remembers previous background', () => {
    const s = (
      colorize([3, 1], 'x')
      + colorize([4], 'mas')
    )
    expect(parse(s))
      .toEqual([
        { text: 'x', foreground: 3, background: 1 },
        { text: 'mas', foreground: 4, background: 1 },
      ])
  })

  it('resets colors & styles', () => {
    const s = (
      BOLD_CHAR + ITALIC_CHAR + UNDERLINE_CHAR
      + COLOR_CHAR + 4
      + 'x'
      + RESET_CHAR
      + 'y'
    )
    expect(parse(s))
      .toEqual([
        { text: 'x', foreground: 4, styles: ['bold', 'italic', 'underline'] },
        { text: 'y' },
      ])
  })

  it('parses highlight', () => {
    expect(parse('foo'))
      .toEqual([
        { text: 'foo', isHighlight: true },
      ])
  })
})
