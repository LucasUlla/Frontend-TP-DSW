import { create } from 'zustand'
import type { Client } from '../../shared/types'

//Plantilla de store
interface AuthState {
  client: Client | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (client: Client, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('token')
  const storedClient = localStorage.getItem('client')

  return {
    client: storedClient ? JSON.parse(storedClient) : null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    setAuth: (client, token) => {
      localStorage.setItem('token', token)
      localStorage.setItem('client', JSON.stringify(client))
      set({ client, token, isAuthenticated: true })
    },
    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('client')
      set({ client: null, token: null, isAuthenticated: false })
    },
  }
})