import reactions from './reactions'

export default store => next => action => {
  const result = next(action)
  const reaction = reactions[action.type]
  if (reaction) {
    store.dispatch(reaction(action.payload))
  }
  return result
}
