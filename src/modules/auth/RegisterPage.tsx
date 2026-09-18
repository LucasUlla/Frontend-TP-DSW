import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
//import axios from 'axios'
import { registerRequest } from './auth.api'
import type { RegisterPayload } from './auth.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error.ts'
interface RegisterFormData {
  name: string
  surname: string
  email: string
  doc: string
  password: string
  confirmPassword: string
  birth_date: string
}

export default function RegisterPage() {
  const [apiError, setApiError] = useState<string | null>(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>()

  const password = useWatch({ control, name: 'password' })

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null)

    const payload: RegisterPayload = {
      name: data.name,
      surname: data.surname,
      email: data.email,
      doc: data.doc,
      password: data.password,
      birth_date: data.birth_date,
      type_user: 'Socio',
    }

    try {
      await registerRequest(payload)
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      const message = getApiErrorMessage(err, 'Error al registrarse. Intentá de nuevo.')

      if (message.includes('Duplicate entry')) {
      if (message.toLowerCase().includes('email')) {
        setApiError('Ese email ya está registrado')
      } else if (message.toLowerCase().includes('doc')) {
        setApiError('Ese documento ya está registrado')
      } else {
        setApiError('Ya existe un cliente con esos datos')
      }
      } else {
          setApiError(message)
        }
      }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4"
        noValidate
      >
        <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>

        {apiError && (
          <p className="text-red-600 text-sm text-center">{apiError}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              className="w-full border rounded px-3 py-2"
              {...register('name', { required: 'Requerido' })}
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Apellido</label>
            <input
              className="w-full border rounded px-3 py-2"
              {...register('surname', { required: 'Requerido' })}
            />
            {errors.surname && (
              <p className="text-red-600 text-xs mt-1">{errors.surname.message}</p>
            )}
          </div>
        </div>

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
          <label className="block text-sm font-medium mb-1">N° Documento</label>
            <input
              className="w-full border rounded px-3 py-2"
              {...register('doc', {
                required: 'Requerido',
                pattern: {
                  value: /^\d{7,8}$/,
                  message: 'Debe contener solo números, entre 7 y 8 dígitos',
                },
              })}
            />
            {errors.doc && (
              <p className="text-red-600 text-xs mt-1">{errors.doc.message}</p>
            )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha de nacimiento</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            {...register('birth_date', { required: 'Requerido' })}
          />
          {errors.birth_date && (
            <p className="text-red-600 text-xs mt-1">{errors.birth_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            {...register('password', {
              required: 'La contraseña es obligatoria',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
          />
          {errors.password && (
            <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Repetir contraseña</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            {...register('confirmPassword', {
              required: 'Repetí la contraseña',
              validate: (value) => value === password || 'Las contraseñas no coinciden',
            })}
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="text-sm text-center">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  )
}