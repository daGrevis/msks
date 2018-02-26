import fp from 'lodash/fp'

// 101 on IRC fomatting: https://github.com/myano/jenni/wiki/IRC-String-Formatting

const COLOR_CHAR = '\u0003'
const BOLD_CHAR = '\u0002'
const ITALIC_CHAR = '\u001d'
const UNDERLINE_CHAR = '\u001f'
const RESET_CHAR = '\u000f'

// eslint-disable-next-line no-unused-vars
const logChars = s => {
  console.log(s, fp.map(c => c.charCodeAt(), s))
}

function colorize([fg, bg], s) {
  return (
    COLOR_CHAR
    + fg
    + (bg ? (',' + bg) : '')
    + s
  )
}

function bold(s) {
  return BOLD_CHAR + s + BOLD_CHAR
}

function italic(s) {
  return ITALIC_CHAR + s + ITALIC_CHAR
}

function underline(s) {
  return UNDERLINE_CHAR + s + UNDERLINE_CHAR
}

const createToken = (type, payload) => {
  if (fp.isUndefined(payload)) {
    return { type }
  }

  return { type, payload }
}

const tokenizeHighlights = token => {
  const splits = fp.split(/<highlight>(.+?)<\/highlight>/, token.payload)

  return fp.pipe([
    fp.chunk(2),
    fp.map(([text, highlight]) => fp.reject(fp.isUndefined, [
      text ? createToken('text', text) : undefined,
      highlight ? createToken('highlight', highlight) : undefined,
    ])),
    fp.flatten,
  ])(splits)
}

const tokenizeLinks = token => {
  const splits = fp.split(/(\S+:\/\/\S+)/, token.payload)

  return fp.pipe([
    fp.chunk(2),
    fp.map(([s, link]) => fp.reject(fp.isUndefined, [
      s ? createToken('text', s) : undefined,
      link ? createToken('link', link) : undefined,
    ])),
    fp.flatten,
  ])(splits)
}

const tokenizeColors = token => {
  if (!fp.includes(COLOR_CHAR, token.payload)) {
    return token
  }

  return fp.pipe([
    fp.split(new RegExp(`${COLOR_CHAR}([0-9]{1,2})(,[0-9]{1,2})?`)),
    fp.chunk(3),
    fp.map(([s, fg, bg]) => fp.reject(fp.isUndefined, [
      s ? createToken('text', s) : undefined,
      fg ? createToken('foreground', +fg) : undefined,
      bg ? createToken('background', +bg.slice(1)) : undefined,
    ])),
    fp.flatten,
  ])(token.payload)
}

const createTokenizer = (type, pattern) => token => {
  if (!fp.includes(pattern, token.payload)) {
    return token
  }

  return fp.pipe([
    fp.split(pattern),
    fp.map(s => (
      fp.reject(fp.isUndefined, [
        s ? createToken('text', s) : undefined,
        createToken(type),
      ])
    )),
    fp.flatten,
    fp.dropRight(1),
  ])(token.payload)
}

const tokenizeResets = createTokenizer('reset', RESET_CHAR)
const tokenizeBolds = createTokenizer('bold', BOLD_CHAR)
const tokenizeItalics = createTokenizer('italic', ITALIC_CHAR)
const tokenizeUnderlines = createTokenizer('underline', UNDERLINE_CHAR)

const applyTokenizer = tokenizerFn => fp.pipe([
  fp.map(token => (
    token.type === 'text'
    ? tokenizerFn(token)
    : token
  )),
  fp.flatten,
])

const tokenize = ({ highlights }) => fp.pipe([
  input => [createToken('text', highlights ? highlights : input)],
  highlights ? applyTokenizer(tokenizeHighlights) : fp.identity,
  applyTokenizer(tokenizeColors),
  applyTokenizer(tokenizeResets),
  applyTokenizer(tokenizeBolds),
  applyTokenizer(tokenizeItalics),
  applyTokenizer(tokenizeUnderlines),
  applyTokenizer(tokenizeLinks),
])

const fragmentize = () => tokens => fp.reduce((prev, token) => {
  switch (token.type) {
    case 'text':
    case 'link':
    case 'highlight':
      let fragment = {
        text: token.payload,
      }

      if (token.type === 'link') {
        fragment.isLink = true
      }
      if (token.type === 'highlight') {
        fragment.isHighlight = true
      }

      if (!fp.isUndefined(prev.foreground)) {
        fragment.foreground = prev.foreground
      }
      if (!fp.isUndefined(prev.background)) {
        fragment.background = prev.background
      }

      const styles = fp.reject(fp.isUndefined, fp.map(k => prev[k] ? k : undefined, ['bold', 'italic', 'underline']))
      if (styles.length) {
        fragment.styles = styles
      }

      return {
        ...prev,
        fragments: fp.concat(prev.fragments, fragment),
      }
    case 'foreground':
      return {
        ...prev,
        foreground: token.payload,
      }
    case 'background':
      return {
        ...prev,
        background: token.payload,
      }
    case 'reset':
      return {
        ...prev,
        bold: undefined,
        italic: undefined,
        underline: undefined,
        foreground: undefined,
        background: undefined,
      }
    case 'bold':
      return {
        ...prev,
        bold: !prev.bold,
      }
    case 'italic':
      return {
        ...prev,
        italic: !prev.italic,
      }
    case 'underline':
      return {
        ...prev,
        underline: !prev.underline,
      }
    default:
      console.log('Token case not handled:', token)
      return prev
  }
}, { fragments: [] }, tokens).fragments

const parse = opts => input => {
  const tokens = tokenize(opts)(input)
  const fragments = fragmentize(opts)(tokens)

  return fragments
}

export {
  parse,
  tokenize,
  createToken,
  COLOR_CHAR,
  BOLD_CHAR,
  ITALIC_CHAR,
  UNDERLINE_CHAR,
  RESET_CHAR,
  colorize,
  bold,
  italic,
  underline,
}
