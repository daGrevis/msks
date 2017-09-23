import React from 'react'

import { navigate } from '../history'

import '../styles/NotFound.css'

const NotFound = () => (
  <div
    className='NotFound'
    onClick={() => navigate('')}
  >
    404
  </div>
)

export default NotFound
