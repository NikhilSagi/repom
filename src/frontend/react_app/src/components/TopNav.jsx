import React from 'react'

export function TopNav({ user, onLoginClick }) {
  return (
    <header className="top-nav">
      <div className="top-nav-title">
        <span>✨</span> RepoMaster
      </div>
      <div className="top-nav-right">
        {user ? (
          <div className="user-chip">👤 {user}</div>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={onLoginClick}>
            Login
          </button>
        )}
      </div>
    </header>
  )
}
