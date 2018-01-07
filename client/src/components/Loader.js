import React from 'react'

import '../styles/Loader.css'

const LoaderAnimation = () =>
  <div className='loader loader-active'>
    <div className='loader-inner ball-pulse'>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>

export default ({ isTall }) => (
  isTall ? (
    <div className='loader-tall'>
      <LoaderAnimation />
    </div>
  ) : (
    <LoaderAnimation />
  )
)
