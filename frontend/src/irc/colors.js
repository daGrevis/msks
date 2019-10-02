import bigInt from 'big-integer'
import md5 from 'js-md5'

const LIGHT_COLORS = [
  'rgba(156, 39, 176, 1)',
  'rgba(3, 169, 244, 1)',
  'rgba(0, 188, 212, 1)',
  'rgba(0, 150, 136, 1)',
  'rgba(233, 30, 99, 1)',
  'rgba(121, 85, 72, 1)',
  'rgba(255, 152, 0, 1)',
  'rgba(205, 220, 57, 1)',
  'rgba(63, 81, 181, 1)',
  'rgba(139, 195, 74, 1)',
  'rgba(255, 87, 34, 1)',
  'rgba(255, 193, 7, 1)',
]

const DARK_COLORS = [
  'rgba(156, 39, 176, .75)',
  'rgba(3, 169, 244, .75)',
  'rgba(0, 188, 212, .75)',
  'rgba(0, 150, 136, .75)',
  'rgba(233, 30, 99, .75)',
  'rgba(121, 85, 72, .75)',
  'rgba(255, 152, 0, .75)',
  'rgba(205, 220, 57, .75)',
  'rgba(63, 81, 181, .75)',
  'rgba(139, 195, 74, .75)',
  'rgba(255, 87, 34, .75)',
  'rgba(255, 193, 7, .75)',
]

const getNickColor = s => {
  const { matchMedia, CSS } = window

  const isDark =
    matchMedia && matchMedia('(prefers-color-scheme: dark)').matches
  const hasCssVarSupport = CSS && CSS.supports('color', 'var(--fake-var)')

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const colorIndex = bigInt(md5(s), 16).mod(colors.length) + 0

  if (hasCssVarSupport) {
    return `var(--nickColor${colorIndex})`
  }

  return colors[colorIndex]
}

export { getNickColor }
