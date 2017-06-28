var tape = require('tape')
var http = require('http')
var api = require('../api')
var server

tape('setup', function (t) {
  var handler = api.start()
  server = http.createServer(handler)
  server.listen(8080)
  t.end()
})

tape('authentication', function (t) {
  t.test('signup', function (assert) {
    assert.plan(6)
    var user = {
      name: 'John Doe',
      mail: 'jdoe@mail.com',
      pass: 'foobarsecret',
      passwordConfirm: 'foobarsecret'
    }

    makeRequest('POST', '/api/v1/user', user, function (body, res) {
      assert.equal(res.statusCode, 200)
      assert.ok(res.headers['x-session-token'])
      assert.ok(body.token)
      assert.ok(body.id)
      assert.notOk(body.pass)
      assert.equal(body.token, res.headers['x-session-token'])
    })
  })

  t.test('signin', function (assert) {
    assert.plan(3)
    var credentials = {
      mail: 'jdoe@mail.com',
      pass: 'foobarsecret'
    }
    makeRequest('POST', '/api/v1/login', credentials, function (body, res) {
      assert.equal(res.statusCode, 200)
      assert.ok(res.headers['x-session-token'])
      assert.notOk(body.pass)
    })
  })

  t.test('current user', function (assert) {
    assert.plan(2)
    var credentials = {
      mail: 'jdoe@mail.com',
      pass: 'foobarsecret'
    }

    makeRequest('POST', '/api/v1/login', credentials, function (body, res) {
      makeRequest('GET', '/api/v1/user/' + res.headers['x-session-token'], null, res.headers, function (body, res) {
        assert.equal(res.statusCode, 200)
        assert.notOk(body.pass)
      })
    })
  })

  t.test('signout', function (assert) {
    assert.plan(2)
    var credentials = {
      mail: 'jdoe@mail.com',
      pass: 'foobarsecret'
    }

    makeRequest('POST', '/api/v1/login', credentials, function (body, res) {
      makeRequest('POST', '/api/v1/logout', res.headers['x-session-token'], function (body, res) {
        assert.equal(res.statusCode, 200)
        assert.equal('signed out', body.message)
      })
    })
  })
})

tape('session', function (t) {
  t.test('no access to data if user is not logged in', function (assert) {
    assert.plan(3)
    makeRequest('GET', '/api/v1/user', null, function (body, res) {
      assert.equal(res.statusCode, 403)
      assert.equal(body.message, 'Not allowed')
      assert.notOk(body.pass)
    })
  })

  t.test('user data can only be modifyied by itself', function (assert) {
    assert.plan(3)
    var user = {
      name: 'Johann P',
      mail: 'jp@mail.com',
      pass: 'foobarsecret',
      passwordConfirm: 'foobarsecret'
    }

    makeRequest('POST', '/api/v1/user', user, function (body, res) {
      var newUser = user
      newUser.name = 'Peter Gabriel'
      newUser.mail = 'pg@mail.com'
      newUser.token = res.headers['x-session-token']
      makeRequest('PUT', '/api/v1/user/' + body.id, newUser, { 'x-session-token': res.headers['x-session-token'] }, function (body, res) {
        assert.equal(res.statusCode, 200)
        makeRequest('GET', '/api/v1/user/' + res.headers['x-session-token'], null, res.headers, function (body, res) {
          assert.equal(res.statusCode, 200)
          assert.equal(body.name, newUser.name)
        })
      })
    })
  })
})

tape('teardown', function (t) {
  server.close()
  t.end()
})

function makeRequest (method, route, data, headers, cb) {
  if (typeof headers === 'function') {
    cb = headers
    headers = {}
  }
  var req = http.request({ port: 8080, method: method, path: route, headers: Object.assign(headers, {'Content-Type': 'application/json'}) }, function (res) {
    res.on('error', function (err) {
      throw err
    })
    var body = []
    res.on('data', function (chunk) {
      body.push(chunk)
    })
    res.on('end', function () {
      var bodyString = body.toString()
      cb(bodyString ? JSON.parse(bodyString) : '{}', res)
    })
  })
  req.on('error', function (err) {
    throw err
  })
  if (data) {
    req.write(JSON.stringify(data))
  }
  req.end()
}
