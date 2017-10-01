import _ from 'lodash'

const isSameDay = (d1, d2) => (
  d1.getFullYear() === d2.getFullYear()
  && d1.getMonth() === d2.getMonth()
  && d1.getDate() === d2.getDate()
)

const isSameYear = (d1, d2) => (
  d1.getFullYear() === d2.getFullYear()
)

const getDaysBetween = (d1, d2) => (
  Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24))
)

const getStartOfDay = d => (
  new Date(d.getFullYear(), d.getMonth(), d.getDate())
)

export {
  isSameDay,
  isSameYear,
  getDaysBetween,
  getStartOfDay,
}
