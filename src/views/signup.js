var html = require('bel')
var signUp = require('../store/actions').signUp
var setError = require('../store/actions').setError
var errorElement = require('./_error')

function signupView (params, store) {
  return html`<main class="helvetica pa4 black-80">
  ${store.getState().errorSignup ? errorElement(store.getState().errorSignup) : ''}
  <form class="measure center" onsubmit="${signup}">
    <fieldset id="sign_up" class="ba b--transparent ph0 mh0">
      <legend class="f4 fw6 ph0 mh0">Sign Up</legend>
      <div class="mt3">
        <label class="db fw6 lh-copy f6" for="name">Name</label>
        <input class="pa2 input-reset ba bg-transparent hover-bg-black hover-white w-100" type="text" name="name"  id="name">
      </div>
      <div class="mt3">
        <label class="db fw6 lh-copy f6" for="email-address">Email</label>
        <input class="pa2 input-reset ba bg-transparent hover-bg-black hover-white w-100" type="email" name="email-address"  id="email-address">
      </div>
      <div class="mv3">
        <label class="db fw6 lh-copy f6" for="password">Password</label>
        <input class="b pa2 input-reset ba bg-transparent hover-bg-black hover-white w-100" type="password" name="password"  id="password">
      </div>
      <div class="mv3">
        <label class="db fw6 lh-copy f6" for="repeated-password">Repeat password</label>
        <input class="b pa2 input-reset ba bg-transparent hover-bg-black hover-white w-100" type="password" name="repeated-password"  id="repeatedpassword">
      </div>
    </fieldset>
    <div class="">
      <input class="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6 dib" type="submit" value="Sign up">
    </div>
    <div class="lh-copy mt3">
      <a href="" data-route="/signin" class="f6 link dim black db">Sign in</a>
    </div>
  </form>
</main>`

  function signup (e) {
    e.preventDefault()
    var name = document.querySelector('#name').value
    var mail = document.querySelector('#email-address').value
    var password = document.querySelector('#password').value
    var repeatedPassword = document.querySelector('#repeatedpassword').value

    signUp(name, mail, password, repeatedPassword, store, function (err) {
      if (err) {
        setError(err.message || 'Unknown error', 'signup', store)
        return
      }
      if (store.getState().errorSignup) setError(null, 'signup', store)
      window.RouterInstance.goToPath('/')
    })
  }
}
module.exports = signupView
