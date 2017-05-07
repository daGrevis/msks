import bigInt from 'big-integer'
import md5 from 'js-md5'

const colors = [
  '#9c27b0',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#e91e63',
  '#795548',
  '#ff9800',
  '#cddc39',
  '#3f51b5',
  '#8bc34a',
  '#ff5722',
  '#ffc107',
]

const getColor = s => (
  colors[bigInt(md5(s), 16).mod(colors.length)]
)

export {
  colors,
  getColor,
}
