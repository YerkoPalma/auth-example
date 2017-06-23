var Router = require('singleton-router')
var css = require('sheetify')
var html = require('bel')
var nanomorph = require('nanomorph')
var createStore = require('redux').createStore
var reducer = require('./store/reducer')
var homeView = require('./views/home')
var signinView = require('./views/signin')
var signupView = require('./views/signup')

css('tachyons')

var router = Router()
var store = createStore(reducer)
store.subscribe(render)

router.setStore(store)
router.addRoute('/', homeView)
router.addRoute('/signin', signinView)
router.addRoute('/signup', signupView)
router.notFound(notFoundView)
router.setRoot('/')
router.start()

function notFoundView (params, state) {
  return html`<main>
    <h1>ups! nothing here :(</h1>
  </main>`
}

function render (prev, curr) {
  var _prev = router.rootEl.lasttElementChild || router.rootEl.lastChild
  var _curr = router.currentRoute.onStart(store)
  console.log('updated state to: ' + JSON.stringify(store.getState()))
  nanomorph(_prev, _curr)
}
