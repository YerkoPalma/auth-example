function reducer (state, action) {
  state = state || {}
  switch (action.type) {
    case 'ERROR':
      state.error = action.data
      return state
    case 'SET_CURRENT_USER':
      state.currentUser = action.data
      return state
    case 'DELETE_CURRENT_USER':
      state.currentUser = null
      return state
    default:
      return state
  }
}
module.exports = reducer
