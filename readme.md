# auth-example
[![Build Status](https://img.shields.io/travis/YerkoPalma/auth-example/master.svg?style=flat-square)](https://travis-ci.org/YerkoPalma/auth-example) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

> simple auth example

## What's this?

This is a basic example of handmade authentication with my 
[full-stack template][full-stack], it includes a simple profile and a signin 
and signup view. To achieve this I've used the [secure-password][secure-password] 
package, and defined some middlewares to use with cookies and headers for 
session management.

## TODO

- [x] Use sublevel for indexing and searchs with level-search
- [x] Finish session middleware
- [x] Better handle errors
  - [x] Email must be unique
  - [x] Password longer than 6 characters
  - [x] 403 errors
  - [x] 404 errors
  - [x] 500 errors
  - [x] Handle password confirmation on server
- [x] Tests

## License
[MIT](/license)

[full-stack]: https://github.com/YerkoPalma/templates/tree/master/full-stack
[secure-password]: https://github.com/emilbayes/secure-password
