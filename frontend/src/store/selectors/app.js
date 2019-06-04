import { createSelector } from 'reselect'

const isInitialChannelsLoadedSelector = state => state.isInitialChannelsLoaded

const isInitialConnectionsLoadedSelector = state =>
  state.isInitialConnectionsLoaded

const isAppLoadingSelector = createSelector(
  isInitialChannelsLoadedSelector,
  isInitialConnectionsLoadedSelector,
  (isInitialChannelsLoaded, isInitialConnectionsLoaded) =>
    !isInitialConnectionsLoaded || !isInitialChannelsLoaded,
)

export { isAppLoadingSelector }
