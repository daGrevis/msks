const env = process.env.NODE_ENV || 'development'

const startDevelopment = () => {
  const nodemon = require('nodemon')

  const monitor = nodemon({
    script: 'src/index.js',
    ext: 'js json',
  })

  monitor.on('restart', () => {
    console.log()
  })

  process.once('SIGINT', () => {
    monitor.once('exit', () => {
      process.exit()
    })
  })
}

const startProduction = () => {
  require('./index')
}

if (env === 'development') {
  startDevelopment()
} else {
  startProduction()
}
