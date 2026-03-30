import React from 'react'

export function WelcomeScreen() {
  return (
    <div className="welcome">
      <div className="welcome-icon">✨</div>
      <h2 className="welcome-title">RepoMaster</h2>
      <p className="welcome-subtitle">Hello! I'm your AI coding assistant. How can I help you?</p>
      <div className="welcome-cards">
        <div className="welcome-card">🔍 GitHub Repo Search</div>
        <div className="welcome-card">🐛 Bug Fix & Debug</div>
        <div className="welcome-card">💻 Code Analysis</div>
        <div className="welcome-card">🚀 Project Development</div>
      </div>
    </div>
  )
}
