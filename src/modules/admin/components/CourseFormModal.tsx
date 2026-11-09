import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getApiErrorMessage } from '../../../shared/lib/api.Error'
import { capitalize } from '../../../shared/lib/formatters'
import { WEEKDAYS } from '../../../shared/types'
import type { Course, CoursePayload, Sport, Weekday } from '../../../shared/types'

interface CourseFormData {
  course_no: number
  days: Weekday[]
  start_time: string
  end_time: string
  professor: string
  start_date: string
  finish_date: string
  quota: number
  sport: number
}

interface CourseFormModalProps {
  isOpen: boolean
  editingCourse: Course | null
  sports: Sport[]
  onClose: () => void
  onSubmitCourse: (payload: CoursePayload) => Promise<void>
}

function parseCourseErrorMessage(
  err: unknown,
  fallback: string
): { message: string; field?: 'course_no' } {
  const msg = getApiErrorMessage(err, fallback)
  if (msg.toLowerCase().includes('duplicate entry')) {
    return { message: 'Ya existe un dictado con ese número de curso.', field: 'course_no' }
  }
  return { message: msg }
}

export default function CourseFormModal({
  isOpen,
  editingCourse,
  sports,
  onClose,
  onSubmitCourse,
}: CourseFormModalProps) {
  const isEdit = Boolean(editingCourse)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormData>()

  useEffect(() => {
    if (!isOpen) return
    setServerError(null)
    if (editingCourse) {
      reset({
        course_no: editingCourse.course_no,
        days: editingCourse.days,
        start_time: editingCourse.start_time,
        end_time: editingCourse.end_time,
        professor: editingCourse.professor,
        start_date: editingCourse.start_date.split('T')[0],
        finish_date: editingCourse.finish_date.split('T')[0],
        quota: editingCourse.quota,
        sport: editingCourse.sport?.id,
      })
    } else {
      reset({
        course_no: undefined,
        days: [],
        start_time: '',
        end_time: '',
        professor: '',
        start_date: '',
        finish_date: '',
        quota: undefined,
        sport: '' as unknown as number,
      })
    }
  }, [isOpen, editingCourse, reset])

  if (!isOpen) return null

  const onSubmit = async (data: CourseFormData) => {
    setServerError(null)
    const payload: CoursePayload = {
      course_no: Number(data.course_no),
      days: data.days,
      start_time: data.start_time,
      end_time: data.end_time,
      professor: data.professor.trim(),
      start_date: data.start_date,
      finish_date: data.finish_date,
      quota: Number(data.quota),
      sport: Number(data.sport),
    }

    try {
      await onSubmitCourse(payload)
      reset()
    } catch (err) {
      const fallback = isEdit ? 'Error al actualizar el dictado.' : 'Error al crear el dictado.'
      const { message, field } = parseCourseErrorMessage(err, fallback)
      if (field) {
        setError(field, { type: 'server', message })
      } else {
        setServerError(message)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit && editingCourse
              ? `Modificar Dictado #${editingCourse.course_no}`
              : 'Alta de Dictado'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° de curso *</label>
              <input
                type="number"
                className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                  errors.course_no
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                {...register('course_no', {
                  required: 'Requerido',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Debe ser mayor a 0' },
                })}
              />
              {errors.course_no && (
                <p className="text-red-600 text-xs mt-1">{errors.course_no.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cupo *</label>
              <input
                type="number"
                className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                  errors.quota
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                {...register('quota', {
                  required: 'Requerido',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Debe ser mayor a 0' },
                })}
              />
              {errors.quota && <p className="text-red-600 text-xs mt-1">{errors.quota.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deporte *</label>
            <select
              className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                errors.sport
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
              defaultValue=""
              {...register('sport', { required: 'Requerido', valueAsNumber: true })}
            >
              <option value="" disabled>
                Seleccionar...
              </option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {capitalize(s.name)}
                </option>
              ))}
            </select>
            {errors.sport && <p className="text-red-600 text-xs mt-1">{errors.sport.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profesor/a *</label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                errors.professor
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
              {...register('professor', { required: 'Requerido' })}
            />
            {errors.professor && (
              <p className="text-red-600 text-xs mt-1">{errors.professor.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Días *</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <label
                  key={day}
                  className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 has-checked:bg-blue-50 has-checked:border-blue-400 has-checked:text-blue-700 transition"
                >
                  <input
                    type="checkbox"
                    value={day}
                    className="accent-blue-600"
                    {...register('days', { required: 'Seleccioná al menos un día' })}
                  />
                  {day}
                </label>
              ))}
            </div>
            {errors.days && <p className="text-red-600 text-xs mt-1">{errors.days.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio *</label>
              <input
                type="time"
                className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                  errors.start_time
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                {...register('start_time', { required: 'Requerido' })}
              />
              {errors.start_time && (
                <p className="text-red-600 text-xs mt-1">{errors.start_time.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de fin *</label>
              <input
                type="time"
                className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                  errors.end_time
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                {...register('end_time', {
                  required: 'Requerido',
                  validate: (value) =>
                    !watch('start_time') ||
                    value > watch('start_time') ||
                    'Debe ser posterior a la hora de inicio',
                })}
              />
              {errors.end_time && (
                <p className="text-red-600 text-xs mt-1">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio *</label>
              <input
                type="date"
                className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                  errors.start_date
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                {...register('start_date', { required: 'Requerido' })}
              />
              {errors.start_date && (
                <p className="text-red-600 text-xs mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin *</label>
              <input
                type="date"
                className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                  errors.finish_date
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                {...register('finish_date', { required: 'Requerido' })}
              />
              {errors.finish_date && (
                <p className="text-red-600 text-xs mt-1">{errors.finish_date.message}</p>
              )}
            </div>
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
                : 'Crear Dictado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}