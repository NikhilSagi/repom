import { useState, useCallback } from 'react'
import { login as apiLogin, register as apiRegister } from '../api/auth'

const STORAGE_KEY = 'repomaster_auth'

function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function useAuth() {
  const [auth, setAuth] = useState(() => loadAuth())

  const persist = (data) => {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    else localStorage.removeItem(STORAGE_KEY)
    setAuth(data)
  }

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password)
    persist(data)
    return data
  }, [])

  const register = useCallback(async (username, password) => {
    const data = await apiRegister(username, password)
    persist(data)
    return data
  }, [])

  const logout = useCallback(() => persist(null), [])

  // Generate a stable guest ID
  const guestId = (() => {
    let id = localStorage.getItem('repomaster_guest_id')
    if (!id) {
      id = 'guest_' + Math.random().toString(36).slice(2, 8)
      localStorage.setItem('repomaster_guest_id', id)
    }
    return id
  })()

  return {
    auth,
    userId: auth?.user_id ?? guestId,
    username: auth?.username ?? null,
    isLoggedIn: !!auth,
    login,
    register,
    logout,
  }
}
