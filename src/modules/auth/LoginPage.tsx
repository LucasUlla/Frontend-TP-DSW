import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { loginRequest } from './auth.api'
import { useAuthStore } from './authStore'
import axios from 'axios'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const [apiError, setApiError] = useState<string | null>(null)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null)
    try {
      const res = await loginRequest(data.email, data.password)
      const dataResponse = res.data.data
      const client = 'client' in dataResponse ? dataResponse.client : dataResponse
      const token = 'token' in dataResponse ? dataResponse.token : null

      setAuth(client, token)
      navigate(client.type_user === 'Admin' ? '/admin' : '/socio')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setApiError('Email o contraseña incorrectas')
      } else {
        setApiError('Error al iniciar sesión. Intentá de nuevo.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
        noValidate
      >
        <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>

        {apiError && (
          <p className="text-red-600 text-sm text-center">{apiError}</p>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            {...register('email', {
              required: 'El email es obligatorio',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido',
              },
            })}
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            {...register('password', {
              required: 'La contraseña es obligatoria',
            })}
          />
          {errors.password && (
            <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="text-sm text-center">
          ¿No tenés cuenta?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Registrate
          </a>
        </p>
      </form>
    </div>
  )
}