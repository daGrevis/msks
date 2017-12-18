import React from 'react'

import { history } from '../history'

import '../styles/NotFound.css'

const NotFound = () => (
  <div
    className='NotFound'
    onClick={() => history.push('')}
  >
    404
  </div>
)

export default NotFound
