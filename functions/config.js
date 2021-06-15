const functions = require('firebase-functions')
const fs = require('fs')

let config = functions.config().env

if (process.env.NODE_ENV !== 'production') {
  if (fs.existsSync('./env.json')) {
    const env = require('./env.json')

    config = env
  }
}

module.exports = config