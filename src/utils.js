import frozenMoment from 'frozen-moment'

function mo(when) {
  return frozenMoment(when).freeze()
}

export {
  mo,
}
