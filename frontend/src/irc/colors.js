import bigInt from 'big-integer'
import md5 from 'js-md5'

const getNickColor = s => {
  const colorIndex = bigInt(md5(s), 16).mod(12) + 0

  return `var(--nickColor${colorIndex})`
}

export { getNickColor }
