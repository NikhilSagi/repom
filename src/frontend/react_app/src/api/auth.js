import client from './client'

export const login = (username, password) =>
  client.post('/api/auth/login', { username, password }).then(r => r.data)

export const register = (username, password) =>
  client.post('/api/auth/register', { username, password }).then(r => r.data)
