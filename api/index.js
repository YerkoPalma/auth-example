var merry = require('merry')
var level = require('level')
var sub = require('level-sublevel')
var search = require('level-search')
var securePassword = require('secure-password')
var Resource = require('./lib/resource')
var Model = require('./lib/factory')
var Nanostack = require('nanostack')
var pwd = securePassword()

var app = merry()
var stack = Nanostack()
// push to middleware
stack.push(function timeElapsed (ctx, next) {
  // GET request need to be logged in
  if (ctx.req.method === 'GET') {
    
  // PUT, DELETE need to be logged in and only for the logged user
  // POST get special treatment
  } else if (ctx.req.method === 'PUT' || ctx.req.method === 'DELETE') {
    
  } else {
    next()
  }
})

var resource = Resource(app, stack)

var db = process.env.ENV !== 'production'
        ? sub(require('memdb')()) : sub(level(process.env.DB))
var index = search(db, 'search')
var User = Model(db, 'user')

var opt = {
  version: 1,
  path: 'user',
  overwrite: [
    {
      // POST create (signup)
      method: 'POST',
      route: '/api/v' + (this.version || 1) + '/user',
      handler: signup
    },
    {
      // POST login (signup)
      method: 'POST',
      route: '/api/v' + (this.version || 1) + '/login',
      handler: signin
    },
    {
      // POST login (signup)
      method: 'POST',
      route: '/api/v' + (this.version || 1) + '/logout',
      handler: signout
    }
  ]
}

resource(User, opt)

app.route('default', function (req, res, ctx) {
  ctx.send(404, { message: 'not found' })
})

function signup (req, res, ctx) {
  var user = null
  User.getBodyData(req, function (err, data) {
    if (err) throw err
    user = data
    // user data already has name, mail and passwrod, but
    // the password isn't encrypted, so encryp it with secure-password
    // and add a token for session

    var userPassword = Buffer.from(data.pass)
    pwd.hash(userPassword, function (err, hash) {
      if (err) throw err
      user.pass = hash
      // generate a token from the email
      var token = Buffer.from(user.mail).toString('base64')
      user.token = token
      // data is now ready, so make the request
      req.write(JSON.stringify(user), function () {
        User.post(req, Object.assign({ valueEncoding: 'json' }, ctx.params), function (err, data) {
          if (err) throw err
        })
      })
    })
  })
}

function signin (req, res, ctx) {
  User.getBodyData(req, function (err, data) {
    if (err) throw err
    // get a buffer from the password
    var passBuffer = Buffer.from(data.pass)
    // find the user fomr the Db with the given mail
    index.createSearchStream(['mail', data.mail])
      .on('data', function (dbData) {
        // verify the user password with the given password buffer
        pwd.verify(passBuffer, dbData.password, function (err, result) {
          if (err) throw err
          if (result === securePassword.VALID) {
            ctx.send(200, dbData)
          } else if (result === securePassword.VALID_NEEDS_REHASH) {
            ctx.send(200, dbData)
          } else {
            ctx.send(400, { message: 'password not ok' })
          }
        })
      })
  })
}

function signout (req, res, ctx) {
  User.getBodyData(req, function (err, data) {
    if (err) throw err
    index.createSearchStream(['token', data.token])
      .on('data', function (dbData) {
        dbData.token = null
        db.batch()
          .put(dbData.id, dbData)
          .write(function () {
            ctx.send(200, { message: 'signed out' })
          })
      })
  })
}

module.exports = app
