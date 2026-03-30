import React, { useState } from 'react'

export function LoginModal({ onClose, onLogin, onRegister }) {
  const [isLoginTab, setIsLoginTab] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLoginTab) {
        await onLogin(username, password)
        onClose()
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        await onRegister(username, password)
        // Auto switch to login tab or close
        alert('Account created successfully. You are now logged in.')
        onClose()
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-logo">
          <div className="modal-icon">✨</div>
          <div className="modal-title">RepoMaster</div>
          <div className="modal-subtitle">{isLoginTab ? 'Login to your account' : 'Create a new account'}</div>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${isLoginTab ? 'active' : ''}`} onClick={() => setIsLoginTab(true)}>Login</button>
          <button className={`modal-tab ${!isLoginTab ? 'active' : ''}`} onClick={() => setIsLoginTab(false)}>Register</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          {!isLoginTab && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="input" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner"></span> : (isLoginTab ? 'Login' : 'Create Account')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
