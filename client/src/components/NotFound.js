import React from 'react'

import { push } from '../history'

import '../styles/NotFound.css'

const NotFound = () => (
  <div
    className='NotFound'
    onClick={() => push('')}
  >
    404
  </div>
)

export default NotFound
