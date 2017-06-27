var html = require('bel')
var cookie = require('cookie-cutter')
var getCurrentUser = require('../store/actions').getCurrentUser
var signOut = require('../store/actions').signOut

function homeView (params, store) {
  if (!store.getState().currentUser) {
    if (cookie.get('token')) {
      getCurrentUser(cookie.get('token'), store, function (err) {
        if (err) {
          console.error(err)
          window.RouterInstance.goToPath('/signin')
        }
      })
    } else {
      window.RouterInstance.goToPath('/signin')
    }
  }
  return html`<article class="helvetica mw5 center bg-white br3 pa3 pa4-ns mv3 ba b--black-10">
  <div class="tc">
    <img src="https://tachyons.io/img/avatar_1.jpg" class="br-100 h4 w4 dib ba b--black-05 pa2" title="Photo of a kitty staring at you">
    <h1 class="f3 mb2">${store.getState().currentUser ? store.getState().currentUser.name : ''}</h1>
    <h2 class="f5 fw4 gray mt0">CCO (Chief Cat Officer)</h2>
    <a class="link pointer" onclick="${signout}" >sign out</a>
  </div>
</article>`
  function signout(e) {
    e.preventDefault()
    signOut(store, function (err) {
      if (err) throw err
      // delete cookies
      cookie.set('token', '', { expires: new Date(0) })
      window.RouterInstance.goToPath('/signin')
    })
  }
}
module.exports = homeView
