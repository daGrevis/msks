import React from 'react'
import classNames from 'classnames'

import Nick from './Nick'

import '../styles/ServerId.css'

const ServerId = ({ connection, onClick }) => (
  <div
    className={classNames('ServerId', {
      isDisabled: !connection.isConnected,
    })}
    onClick={onClick}
  >
    {connection.serverId}
    {' / '}
    <Nick nick={connection.nick} noColor={!connection.isConnected} />
  </div>
)

export default ServerId
