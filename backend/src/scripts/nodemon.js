const nodemon = require('nodemon')

const monitor = nodemon({
  script: 'src/index.js',
  ext: 'js json',
})

monitor.on('restart', () => {
  console.log()
})

monitor.on('quit', () => {
  process.exit()
})
