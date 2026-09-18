// errores que devuelve la api. Formato {message, data}
import axios from 'axios'

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data

    if (Array.isArray(data?.data)) {
      return data.data.join(' ')
    }

    const backendMessage: string = data?.message ?? ''
    if (backendMessage) return backendMessage
  }

  return fallback
}