import React from 'react'

import Link from './Link'
import { getLinkToFront } from '../routing/links'

import '../styles/NotFound.css'

const NotFound = () => (
  <Link href={getLinkToFront()}>
    <div className="NotFound">404</div>
  </Link>
)

export default NotFound
