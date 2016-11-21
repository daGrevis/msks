import React from 'react'

import './Loader.css'

export default function Loader() {
  return (
    <div className='loader loader-active'>
      <div className='loader-inner ball-pulse'>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  )
}
