import frozenMoment from 'frozen-moment'

function mo(when) {
  return frozenMoment(when).freeze()
}

function stripURI(uri) {
  // Removes all characters except the following: alphabetic, decimal digits, - _ . ! ~ * ' ( )
  return uri.replace(/[^a-zA-Z0-9-_\.!~\*'()]/g, '')
}

export {
  mo,
  stripURI,
}
