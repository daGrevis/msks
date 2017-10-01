import _ from 'lodash'

const isSameDay = (d1, d2) => (
  d1.getUTCFullYear() === d2.getUTCFullYear()
  && d1.getUTCMonth() === d2.getUTCMonth()
  && d1.getUTCDate() === d2.getUTCDate()
)

const isSameYear = (d1, d2) => (
  d1.getUTCFullYear() === d2.getUTCFullYear()
)

const getDaysBetween = (d1, d2) => (
  Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24))
)

const getStartOfDay = d => (
  new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
)

export {
  isSameDay,
  isSameYear,
  getDaysBetween,
  getStartOfDay,
}
