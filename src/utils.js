import fp from 'lodash/fp'

function stripURI(uri) {
  // Removes all characters except the following: alphabetic, decimal digits, - _ . ! ~ * ' ( )
  return uri.replace(/[^a-zA-Z0-9-_\.!~\*'()]/g, '')
}

export {
  stripURI,
}
