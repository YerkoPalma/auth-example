var merry = require('merry')
var level = require('level')
var Resource = require('./lib/resource')
var Model = require('./lib/factory')
var Nanostack = require('nanostack')

var app = merry()
var stack = Nanostack()
// push to middleware

var resource = Resource(app, stack)

var db = process.env.ENV !== 'production'
        ? require('memdb')() : level(process.env.DB)
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
    }
  ]
}

resource(User, opt)

app.route('default', function (req, res, ctx) {
  ctx.send(404, { message: 'not found' })
})

function signup () {
  
}

module.exports = app
