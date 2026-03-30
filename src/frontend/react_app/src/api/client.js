import axios from 'axios'

const client = axios.create({
  baseURL: '',  // Vite proxy handles /api → :8000
  headers: { 'Content-Type': 'application/json' },
})

export default client
