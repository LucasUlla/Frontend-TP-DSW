import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getApiErrorMessage } from '../../../shared/lib/api.Error'
import { capitalize, formatSchedule } from '../../../shared/lib/formatters'
import type { Client, Course } from '../../../shared/types'

interface InscriptionFormData {
  client: number
  course: number
}

interface InscriptionCreateModalProps {
  isOpen: boolean
  clients: Client[]
  courses: Course[]
  onClose: () => void
  onSubmitInscription: (courseId: number, clientId: number) => Promise<void>
}

export default function InscriptionCreateModal({
  isOpen,
  clients,
  courses,
  onClose,
  onSubmitInscription,
}: InscriptionCreateModalProps) {
  const [clientSearch, setClientSearch] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionFormData>()

  useEffect(() => {
    if (isOpen) {
      reset()
      setClientSearch('')
      setCreateError(null)
    }
  }, [isOpen, reset])

  const filteredClientOptions = useMemo(() => {
    const query = clientSearch.trim().toLowerCase()
    if (!query) return clients
    return clients.filter((c) => {
      const fullName = `${c.name || ''} ${c.surname || ''}`.toLowerCase()
      return fullName.includes(query) || (c.doc || '').includes(query)
    })
  }, [clients, clientSearch])

  if (!isOpen) return null

  const onSubmit = async (data: InscriptionFormData) => {
    setCreateError(null)
    try {
      await onSubmitInscription(Number(data.course), Number(data.client))
      reset()
      setClientSearch('')
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Error al crear la inscripción.'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold text-gray-900">Nueva Inscripción</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {createError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Socio *</label>
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <select
              size={5}
              className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                errors.client
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
              {...register('client', { required: 'Seleccioná un socio' })}
            >
              {filteredClientOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {capitalize(c.name)} {capitalize(c.surname)} — DNI {c.doc}
                </option>
              ))}
            </select>
            {errors.client && (
              <p className="text-red-600 text-xs mt-1">{errors.client.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dictado *</label>
            <select
              className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                errors.course
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
              defaultValue=""
              {...register('course', { required: 'Seleccioná un dictado' })}
            >
              <option value="" disabled>
                Seleccionar...
              </option>
              {courses.map((c) => {
                const full = c.quota > 0 && c.inscriptionsCount >= c.quota
                return (
                  <option key={c.id} value={c.id} disabled={full}>
                    {capitalize(c.sport?.name || '')} #{c.course_no} —{' '}
                    {formatSchedule(c.days, c.start_time, c.end_time)} ({c.inscriptionsCount}/
                    {c.quota}){full ? ' — SIN CUPO' : ''}
                  </option>
                )
              })}
            </select>
            {errors.course && (
              <p className="text-red-600 text-xs mt-1">{errors.course.message}</p>
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
              {isSubmitting ? 'Inscribiendo...' : 'Inscribir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}