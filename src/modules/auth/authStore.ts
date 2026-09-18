import { create } from 'zustand'
import type { Client } from '../../shared/types'

interface AuthState {
  client: Client | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (client: Client, token?: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  const storedClient = localStorage.getItem('client')
  const storedToken = localStorage.getItem('token')

  return {
    client: storedClient ? JSON.parse(storedClient) : null,
    token: storedToken || null,
    isAuthenticated: !!storedClient || !!storedToken,
    setAuth: (client, token = null) => {
      localStorage.setItem('client', JSON.stringify(client))
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
      set({ client, token: token || null, isAuthenticated: true })
    },
    logout: () => {
      localStorage.removeItem('client')
      localStorage.removeItem('token')
      set({ client: null, token: null, isAuthenticated: false })
    },
  }
})