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
var Post = Model(db, 'post')

var opt = {
  version: 1,
  path: 'post'
}

resource(Post, opt)

app.route('default', function (req, res, ctx) {
  ctx.send(404, { message: 'not found' })
})

module.exports = app