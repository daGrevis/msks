import fp from 'lodash/fp'

const seed = 7

const colors = [
  '#e91e63',
  '#9c27b0',
  '#3f51b5',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#8bc34a',
  '#cddc39',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
]

const getColorHash = s => (
  fp.reduce((sum, c) => sum + c.charCodeAt(0), seed, s.split(''))
)

const getColor = s => (
  colors[getColorHash(s) % colors.length]
)

export {
  colors,
  getColorHash,
  getColor,
}
