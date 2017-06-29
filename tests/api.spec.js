var tape = require('tape')
var http = require('http')
var api = require('../api')
var server
var id

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
      id = body.id
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
    assert.plan(5)
    var user = {
      name: 'Johann P',
      mail: 'jp@mail.com',
      pass: 'foobarsecret',
      passwordConfirm: 'foobarsecret'
    }

    // create a second user
    makeRequest('POST', '/api/v1/user', user, function (body, res) {
      var newUser = user
      newUser.name = 'Peter Gabriel'
      newUser.mail = 'pg@mail.com'
      newUser.token = res.headers['x-session-token']
      // modify it
      makeRequest('PUT', '/api/v1/user/' + body.id, newUser, { 'x-session-token': res.headers['x-session-token'] }, function (body, res) {
        assert.equal(res.statusCode, 200)
        // check the modified data
        makeRequest('GET', '/api/v1/user/' + res.headers['x-session-token'], null, res.headers, function (body, res) {
          assert.equal(res.statusCode, 200)
          assert.equal(body.name, newUser.name)
          // attempt to modify the first user
          makeRequest('PUT', '/api/v1/user/' + id, newUser, { 'x-session-token': res.headers['x-session-token'] }, function (body, res) {
            assert.equal(res.statusCode, 403)
            assert.equal(body.message, 'Not allowed')
          })
        })
      })
    })
  })
})

tape('validations', function (t) {
  t.test('mail must be unique', function (assert) {
    assert.plan(2)
    var user = {
      name: 'Uniqua',
      mail: 'uniqua@mail.com',
      pass: 'foobarsecret',
      passwordConfirm: 'foobarsecret'
    }

    makeRequest('POST', '/api/v1/user', user, function (body, res) {
      // save it the first time
      makeRequest('POST', '/api/v1/user', user, function (body, res) {
        assert.equal(res.statusCode, 400)
        assert.equal(body.message, 'Email \'uniqua@mail.com\' already in use')
      })
    })
  })
  t.test('password longer than 6', function (assert) {
    assert.plan(2)
    var user = {
      name: 'short pass',
      mail: 'spass@mail.com',
      pass: '1234',
      passwordConfirm: '1234'
    }

    makeRequest('POST', '/api/v1/user', user, function (body, res) {
      // save it the first time
      assert.equal(res.statusCode, 400)
      assert.equal(body.message, 'Password too short')
    })
  })
  t.test('password and confirmation must be equal', function (assert) {
    assert.plan(2)
    var user = {
      name: 'Bad pass',
      mail: 'bpass@mail.com',
      pass: 'foobarsecret',
      passwordConfirm: 'foosecret'
    }

    makeRequest('POST', '/api/v1/user', user, function (body, res) {
      // save it the first time
      assert.equal(res.statusCode, 400)
      assert.equal(body.message, 'Password missmatch')
    })
  })
  t.test('mail and password can\'t be empty', function (assert) {
    assert.plan(4)
    var user = {
      name: 'Bad pass',
      mail: 'bpass@mail.com',
      pass: '',
      passwordConfirm: ''
    }

    makeRequest('POST', '/api/v1/user', user, function (body, res) {
      // save it the first time
      assert.equal(res.statusCode, 400)
      assert.equal(body.message, 'Password can\'t be blank')
      var user2 = {
        name: 'Bad pass',
        mail: '',
        pass: 'foobar',
        passwordConfirm: 'foobar'
      }

      makeRequest('POST', '/api/v1/user', user2, function (body, res) {
        // save it the first time
        assert.equal(res.statusCode, 400)
        assert.equal(body.message, 'Email can\'t be blank')
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
