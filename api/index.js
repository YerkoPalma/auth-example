var merry = require('merry')
var level = require('level')
var dump = require('level-dump')
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
        ? sub(require('memdb')({ valueEncoding: 'json' })) : sub(level(process.env.DB, { valueEncoding: 'json' }))
var index = search(db, 'search')
var User = Model(db, 'user')

var opt = {
  version: 1,
  path: 'user',
  overwrite: [
    {
      // GET currentUser
      method: 'GET',
      route: '/api/v' + (this.version || 1) + '/user/:id',
      handler: getCurrentUser
    },
    {
      // POST create (signup)
      method: 'POST',
      route: '/api/v' + (this.version || 1) + '/user',
      handler: signup
    },
    {
      // POST login (signin)
      method: 'POST',
      route: '/api/v' + (this.version || 1) + '/login',
      handler: signin
    },
    {
      // POST logout (signout)
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

function getCurrentUser (req, res, ctx) {
  var token = ctx.params.id
  var user = null
  index.createSearchStream(['token', token])
    .on('data', function (dbData) {
      user = dbData
    })
    .on('error', function (err) {
      if (user) ctx.send(500, err)
      else ctx.send(400, { message: 'Not found' })
    })
    .on('end', function () {
      if (user) {
        ctx.send(200, user)
      } else {
        ctx.send(400, { message: 'Not found' })
      }
    })
}

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
      user.id = User.model.generateId()
      // data is now ready, so
      // save it to the DB
      db.put(user.id, user, function (err) {
        if (err) throw err
        // then send the user
        ctx.send(200, user, { 'x-session-token': user.token })
      })
    })
  })
}

function signin (req, res, ctx) {
  var user = null
  User.getBodyData(req, function (err, data) {
    if (err) throw err
    // get a buffer from the password
    var passBuffer = Buffer.from(data.pass)
    // find the user fomr the Db with the given mail
    index.createSearchStream(['mail', data.mail])
      .on('data', function (dbData) {
        user = dbData.value
        user.token = User.model.generateId()
        // verify the user password with the given password buffer
        pwd.verify(passBuffer, Buffer.from(user.pass.data), function (err, result) {
          if (err) throw err
          // update token in db
          if (result === securePassword.VALID) {
            db.batch([{ type: 'put', key: user.id, value: user }], function (err) {
              if (err) throw err
              // don't send the pasword buffer to the client
              if (user.pass) delete user.pass
              ctx.send(200, user, { 'x-session-token': user.token })
            })
          } else if (result === securePassword.VALID_NEEDS_REHASH) {
            db.batch([{ type: 'put', key: user.id, value: user }], function (err) {
              if (err) throw err
              // don't send the pasword buffer to the client
              if (user.pass) delete user.pass
              ctx.send(200, user, { 'x-session-token': user.token })
            })
          } else {
            ctx.send(400, { message: 'password not ok' })
          }
        })
      })
  })
}

function signout (req, res, ctx) {
  var user = null
  User.getBodyData(req, function (err, data) {
    if (err) throw err
    dump.allEntries(db)
    console.log(data)
    index.createSearchStream(['token', data])
      .on('error', function (err) {
        throw err
      })
      .on('data', function (dbData) {
        user = dbData.value
        user.token = ''
        db.batch([{ type: 'put', key: user.id, value: user }], function (err) {
          if (err) throw err
          ctx.send(200, { message: 'signed out' })
        })
      })
  })
}

module.exports = app
