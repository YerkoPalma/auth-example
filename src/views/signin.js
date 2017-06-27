var html = require('bel')
var signIn = require('../store/actions').signIn

function signinView (params, store) {
  return html`<main class="helvetica pa4 black-80">
  <form class="measure center" onsubmit="${signin}">
    <fieldset id="sign_up" class="ba b--transparent ph0 mh0">
      <legend class="f4 fw6 ph0 mh0">Sign In</legend>
      <div class="mt3">
        <label class="db fw6 lh-copy f6" for="email-address">Email</label>
        <input class="pa2 input-reset ba bg-transparent hover-bg-black hover-white w-100" type="email" name="email-address"  id="email-address">
      </div>
      <div class="mv3">
        <label class="db fw6 lh-copy f6" for="password">Password</label>
        <input class="b pa2 input-reset ba bg-transparent hover-bg-black hover-white w-100" type="password" name="password"  id="password">
      </div>
      <label class="pa0 ma0 lh-copy f6 pointer"><input type="checkbox"> Remember me</label>
    </fieldset>
    <div class="">
      <input class="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6 dib" type="submit" value="Sign in">
    </div>
    <div class="lh-copy mt3">
      <a href="" data-route="/signup" class="f6 link dim black db">Sign up</a>
    </div>
  </form>
</main>`

  function signin (e) {
    e.preventDefault()
    // get the user data
    var mail = document.querySelector('#email-address').value
    var password = document.querySelector('#password').value

    signIn(mail, password, store, function (err) {
      if (err) throw err
      window.RouterInstance.goToPath('/')
    })
  }
}
module.exports = signinView
