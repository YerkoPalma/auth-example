var http = require('http')
var cookie = require('cookie-cutter')

function getCurrentUser (token, store, cb) {
  makeRequest('GET', '/api/v1/user/' + token, null, function (err, body, res) {
    if (err) return cb(err)
    if (res.statusCode !== 200) cb(new Error('Not found'))
    store.dispatch({ type: 'SET_CURRENT_USER', data: body.data })
    // no need to pass the user
    cb()
  })
}
function signIn (mail, pass, store, cb) {
  var userData = {
    mail: mail,
    pass: pass
  }
  makeRequest('POST', '/api/v1/login', userData, function (err, body, res) {
    if (err) return cb(err)
    store.dispatch({ type: 'SET_CURRENT_USER', data: body })
    cb()
  })
}
function signUp (name, mail, pass, passConfirm, store, cb) {
  if (pass !== passConfirm) return cb(new Error('Password mismatch'))
  var userData = {
    name: name,
    mail: mail,
    pass: pass
  }
  makeRequest('POST', '/api/v1/user', userData, function (err, body, res) {
    if (err) return cb(err)
    store.dispatch({ type: 'SET_CURRENT_USER', data: body })
    cb()
  })
}
function signOut (store, cb) {
  var token = store.getState().currentUser.token
  makeRequest('POST', '/api/v1/logout', token, function (err, body, res) {
    if (err) return cb(err)
    store.dispatch({ type: 'DELETE_CURRENT_USER' })
    cb()
  })
}

module.exports = {
  getCurrentUser: getCurrentUser,
  signIn: signIn,
  signUp: signUp,
  signOut: signOut
}

function makeRequest (method, route, data, cb) {
  var headers = {'Content-Type': 'application/json'}
  if (cookie.get('token')) headers = Object.assign(headers, {'x-session-token': cookie.get('token')})
  var req = http.request({ method: method, path: route, headers: headers }, function (res) {
    if (res.headers && res.headers['x-session-token']) {
      if (res.headers['timeout']) {
        cookie.set('token', res.headers['x-session-token'], { expires: res.headers['timeout'] })
      } else {
        cookie.set('token', res.headers['x-session-token'])
      }
    }
    res.on('error', function (err) {
      cb(err)
    })
    var body = []
    res.on('data', function (chunk) {
      body.push(chunk)
    })
    res.on('end', function () {
      var bodyString = body.toString()
      cb(null, bodyString ? JSON.parse(bodyString) : '{}', res)
    })
  })
  req.on('error', function (err) {
    cb(err)
  })
  if (data) {
    req.write(JSON.stringify(data))
  }
  req.end()
}
