import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { getApiErrorMessage } from '../../../shared/lib/api.Error'
import type { Sport } from '../../../shared/types'

interface SportFormData {
  name: string
}

interface SportFormModalProps {
  isOpen: boolean
  editingSport: Sport | null
  onClose: () => void
  onSubmitSport: (name: string) => Promise<void>
}

function parseSportErrorMessage(err: unknown, fallback: string): string {
  const msg = getApiErrorMessage(err, fallback)
  if (msg.toLowerCase().includes('duplicate entry')) {
    return 'Ya existe un deporte con ese nombre.'
  }
  return msg
}

export default function SportFormModal({
  isOpen,
  editingSport,
  onClose,
  onSubmitSport,
}: SportFormModalProps) {
  const isEdit = Boolean(editingSport)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SportFormData>()

  useEffect(() => {
    if (isOpen) {
      reset({ name: editingSport?.name || '' })
    }
  }, [isOpen, editingSport, reset])

  if (!isOpen) return null

  const onSubmit = async (data: SportFormData) => {
    try {
      await onSubmitSport(data.name.trim())
      reset()
    } catch (err) {
      const fallback = isEdit ? 'Error al actualizar el deporte.' : 'Error al crear el deporte.'
      const msg = parseSportErrorMessage(err, fallback)
      setError('name', { type: 'server', message: msg })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                isEdit ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isEdit ? '✎' : '+'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Modificar Deporte' : 'Alta de Deporte'}
              </h3>
              <p className="text-xs text-gray-500">
                {isEdit && editingSport
                  ? `ID #${editingSport.id}`
                  : 'Ingresá el nombre del nuevo deporte'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del deporte *
            </label>
            <input
              type="text"
              placeholder="Ej: Fútbol, Tenis, Natación..."
              className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                errors.name
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
              {...register('name', {
                required: 'El nombre es obligatorio',
                minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' },
                maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                validate: (value) =>
                  value.trim().length > 0 || 'El nombre no puede estar vacío',
              })}
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-xl text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {isSubmitting
                ? isEdit
                  ? 'Guardando...'
                  : 'Creando...'
                : isEdit
                ? 'Guardar cambios'
                : 'Crear Deporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}