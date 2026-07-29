import { create } from 'zustand'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isAuthLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isAuthLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!response.ok) {
        throw new Error('Authentication failed')
      }
      const data = await response.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user || { username }))
      set({ token: data.token, user: data.user || { username }, isAuthenticated: true, isAuthLoading: false })
      return true
    } catch (err) {
      set({ error: err.message, isAuthLoading: false })
      throw err
    }
  },

  register: async (username, email, password) => {
    set({ isAuthLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })
      if (!response.ok) {
        throw new Error('Registration failed')
      }
      const data = await response.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user || { username, email }))
      set({ token: data.token, user: data.user || { username, email }, isAuthenticated: true, isAuthLoading: false })
      return true
    } catch (err) {
      set({ error: err.message, isAuthLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null, isAuthenticated: false, error: null })
  }
}))
