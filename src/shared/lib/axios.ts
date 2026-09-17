import axios from 'axios'
import { useAuthStore } from '../../modules/auth/authStore'

//Creo instancia base de axios para usarla en la app
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

//Interceptor de request para agregar el token de autenticación a cada solicitud
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

//Interceptor de response para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default api