var fs = require('fs')
var path = require('path')

function loadLocalEnv() {
  var envPath = path.join(__dirname, '..', 'vars.env')
  if (!fs.existsSync(envPath)) {
    return
  }

  var content = fs.readFileSync(envPath, 'utf8')
  content.split(/\r?\n/).forEach(function (line) {
    var trimmed = line.trim()
    if (!trimmed || trimmed[0] === '#') {
      return
    }
    var idx = trimmed.indexOf('=')
    if (idx === -1) {
      return
    }

    var key = trimmed.slice(0, idx).trim()
    var value = trimmed.slice(idx + 1).trim()
    if ((value[0] === '"' && value[value.length - 1] === '"') || (value[0] === "'" && value[value.length - 1] === "'")) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

loadLocalEnv()

module.exports = {
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'dvna',
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT || 3306,
  dialect: 'mysql'
}
