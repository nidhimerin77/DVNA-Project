var express = require('express')
var passport = require('passport')
var session = require('express-session')
var crypto = require('crypto')
var ejs = require('ejs')
var morgan = require('morgan')
const fileUpload = require('express-fileupload');
var config = require('./config/server')

//Initialize Express
var app = express()
require('./core/passport')(passport)
app.use(express.static('public'))
app.set('view engine','ejs')
app.use(morgan('tiny'))
app.use(express.urlencoded({ extended: false }))
app.use(fileUpload());

const isProduction = process.env.NODE_ENV === 'production'
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
if (!process.env.SESSION_SECRET) {
	console.warn('[security] SESSION_SECRET is not set. Using an ephemeral secret for this process.')
}

if (isProduction) {
	app.set('trust proxy', 1)
}

// Intialize Session
app.use(session({
  secret: sessionSecret,
  name: 'dvna.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction
  }
}))

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// Initialize express-flash
app.use(require('express-flash')());

// Routing
app.use('/app',require('./routes/app')())
app.use('/',require('./routes/main')(passport))

// Start Server
app.listen(config.port, config.listen)
