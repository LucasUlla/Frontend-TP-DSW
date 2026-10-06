import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../auth/authStore'
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getSports,
} from './admin.api'
import type { CoursePayload } from './admin.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize } from '../../shared/lib/formatters'
import { SVG_XMLNS } from '../../shared/constants'
import ConfirmModal from '../../shared/components/ConfirmModal'
import type { Course, Sport } from '../../shared/types'

interface CourseFormData {
  course_no: number
  sched: string
  professor: string
  start_date: string
  finish_date: string
  quota: number
  sport: number
}

function parseCourseErrorMessage(err: unknown, fallback: string): string {
  const msg = getApiErrorMessage(err, fallback)
  if (msg.toLowerCase().includes('duplicate entry')) {
    return 'Ya existe un dictado con ese número de curso.'
  }
  return msg
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—'
  const parts = dateString.split('T')[0].split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
  }
  return dateString
}

export default function CoursesAdmin() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [courses, setCourses] = useState<Course[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sportFilter, setSportFilter] = useState<number | 'ALL'>('ALL')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate },
    setError: setErrorCreate,
  } = useForm<CourseFormData>()

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
    setError: setErrorEdit,
  } = useForm<CourseFormData>()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Usado por el botón "Reintentar"
  const fetchData = () => {
    setLoading(true)
    setError(null)
    Promise.all([getCourses(), getSports()])
      .then(([coursesRes, sportsRes]) => {
        setCourses(coursesRes.data.data || [])
        setSports(sportsRes.data.data || [])
      })
      .catch((err) => setError(getApiErrorMessage(err, 'No se pudieron cargar los dictados.')))
      .finally(() => setLoading(false))
  }

  // Carga inicial — lógica inline en el efecto
  useEffect(() => {
    let ignore = false

    Promise.all([getCourses(), getSports()])
      .then(([coursesRes, sportsRes]) => {
        if (ignore) return
        setCourses(coursesRes.data.data || [])
        setSports(sportsRes.data.data || [])
      })
      .catch((err) => {
        if (!ignore) setError(getApiErrorMessage(err, 'No se pudieron cargar los dictados.'))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  // Filtrado por deporte + búsqueda (profesor o número de curso)
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSport = sportFilter === 'ALL' ? true : c.sport?.id === sportFilter

      const query = search.trim().toLowerCase()
      if (!query) return matchesSport

      const professorMatch = (c.professor || '').toLowerCase().includes(query)
      const courseNoMatch = String(c.course_no).includes(query)

      return matchesSport && (professorMatch || courseNoMatch)
    })
  }, [courses, search, sportFilter])

  const buildPayload = (data: CourseFormData): CoursePayload => ({
    course_no: Number(data.course_no),
    sched: data.sched.trim(),
    professor: data.professor.trim(),
    start_date: data.start_date,
    finish_date: data.finish_date,
    quota: Number(data.quota),
    sport: Number(data.sport),
  })

  const onSubmitCreate = async (data: CourseFormData) => {
  try {
    const payload = buildPayload(data)
    const res = await createCourse(payload)
    const matchingSport = sports.find((s) => s.id === payload.sport)
    const newCourse: Course = {
      ...res.data.data,
      sport: matchingSport || res.data.data.sport,
    }
    setCourses((prev) => [...prev, newCourse])
    setIsCreateOpen(false)
    resetCreate()
    setSuccessMessage(`El dictado #${newCourse.course_no} fue creado con éxito.`)
    setTimeout(() => setSuccessMessage(null), 4000)
  } catch (err) {
    const msg = parseCourseErrorMessage(err, 'Error al crear el dictado.')
    setErrorCreate('course_no', { type: 'server', message: msg })
  }
}

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course)
    resetEdit({
      course_no: course.course_no,
      sched: course.sched,
      professor: course.professor,
      start_date: course.start_date.split('T')[0],
      finish_date: course.finish_date.split('T')[0],
      quota: course.quota,
      sport: course.sport?.id,
    })
  }

  const onSubmitEdit = async (data: CourseFormData) => {
  if (!editingCourse) return
  try {
    const payload = buildPayload(data)
    const res = await updateCourse(editingCourse.id, payload)
    const matchingSport = sports.find((s) => s.id === payload.sport)
    const updated: Course = {
      ...res.data.data,
      sport: matchingSport || res.data.data.sport,
    }
    setCourses((prev) => prev.map((c) => (c.id === editingCourse.id ? updated : c)))
    setEditingCourse(null)
    resetEdit()
    setSuccessMessage(`El dictado #${updated.course_no} fue actualizado con éxito.`)
    setTimeout(() => setSuccessMessage(null), 4000)
  } catch (err) {
    const msg = parseCourseErrorMessage(err, 'Error al actualizar el dictado.')
    setErrorEdit('course_no', { type: 'server', message: msg })
  }
}

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteCourse(deleteTarget.id)
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setSuccessMessage(`El dictado #${deleteTarget.course_no} fue eliminado correctamente.`)
      setDeleteTarget(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Error al eliminar el dictado.'))
    } finally {
      setDeleteLoading(false)
    }
  }

  // Formulario compartido entre Alta y Modificación (mismos campos, distinto register/errors)
  function renderFormFields(
    register: typeof registerCreate,
    errors: typeof errorsCreate
  ) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de curso *</label>
            <input
              type="number"
              className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                errors.course_no ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
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
                errors.quota ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
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
              errors.sport ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
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
              errors.professor ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
            }`}
            {...register('professor', { required: 'Requerido' })}
          />
          {errors.professor && <p className="text-red-600 text-xs mt-1">{errors.professor.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horario *</label>
          <input
            type="text"
            placeholder="Ej: Lunes y Miércoles 18:00 a 19:30"
            className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
              errors.sched ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
            }`}
            {...register('sched', { required: 'Requerido' })}
          />
          {errors.sched && <p className="text-red-600 text-xs mt-1">{errors.sched.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio *</label>
            <input
              type="date"
              className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                errors.start_date ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
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
                errors.finish_date ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
              }`}
              {...register('finish_date', { required: 'Requerido' })}
            />
            {errors.finish_date && (
              <p className="text-red-600 text-xs mt-1">{errors.finish_date.message}</p>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white shadow-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
          title="Volver al panel de administración"
        >
          <svg xmlns={SVG_XMLNS} className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="font-semibold text-sm hidden sm:inline">Menú Admin</span>
        </button>

        <button
          onClick={handleLogout}
          className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-md transition"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 lg:px-8 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dictados de Deporte</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Administrá los cursos/horarios concretos de cada deporte
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs text-center">
              <span className="text-xs text-gray-500 block">Total</span>
              <span className="text-lg font-bold text-gray-800">{courses.length}</span>
            </div>

            <button
              type="button"
              disabled={sports.length === 0}
              onClick={() => {
                resetCreate()
                setIsCreateOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={sports.length === 0 ? 'Primero creá al menos un deporte' : undefined}
            >
              <svg xmlns={SVG_XMLNS} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Dictado</span>
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Filtros: búsqueda + deporte */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <svg
              xmlns={SVG_XMLNS}
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por profesor o N° de curso..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
          >
            <option value="ALL">Todos los deportes</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {capitalize(s.name)}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <p className="text-gray-500">Cargando dictados...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center shadow-xs">
            <p className="font-semibold mb-2">Ocurrió un error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && sports.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center shadow-xs">
            Todavía no hay deportes cargados. Creá al menos uno desde{' '}
            <button onClick={() => navigate('/admin/sports')} className="underline font-medium">
              Deportes
            </button>{' '}
            antes de dar de alta un dictado.
          </div>
        )}

        {!loading && !error && sports.length > 0 && filteredCourses.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <p className="text-gray-500 font-medium">No se encontraron dictados</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || sportFilter !== 'ALL'
                ? 'Probá ajustando los filtros.'
                : 'Hacé click en "Nuevo Dictado" para crear el primero.'}
            </p>
          </div>
        )}

        {!loading && !error && filteredCourses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">N° Curso</th>
                    <th className="px-6 py-3.5">Deporte</th>
                    <th className="px-6 py-3.5">Profesor/a</th>
                    <th className="px-6 py-3.5">Horario</th>
                    <th className="px-6 py-3.5">Vigencia</th>
                    <th className="px-6 py-3.5">Cupo</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-mono text-gray-800">#{course.course_no}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          {capitalize(course.sport?.name || '—')}
                        </span>
                      </td>
                      <td className="px-6 py-4">{course.professor}</td>
                      <td className="px-6 py-4 text-xs sm:text-sm">{course.sched}</td>
                      <td className="px-6 py-4 text-xs sm:text-sm">
                        {formatDate(course.start_date)} — {formatDate(course.finish_date)}
                      </td>
                      <td className="px-6 py-4">{course.quota}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(course)}
                            className="text-amber-700 hover:text-amber-900 font-medium text-xs bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-md transition"
                          >
                            Modificar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteTarget(course)
                            }}
                            className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition"
                          >
                            Dar de baja
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Mostrando <strong>{filteredCourses.length}</strong> de <strong>{courses.length}</strong> dictados
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Alta */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Alta de Dictado</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false)
                  resetCreate()
                }}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4" noValidate>
              {renderFormFields(registerCreate, errorsCreate)}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false)
                    resetCreate()
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                >
                  {isSubmittingCreate ? 'Creando...' : 'Crear Dictado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Modificación */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Modificar Dictado #{editingCourse.course_no}</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingCourse(null)
                  resetEdit()
                }}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4" noValidate>
              {renderFormFields(registerEdit, errorsEdit)}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourse(null)
                    resetEdit()
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Baja — reutilizamos el componente compartido */}
      {deleteTarget && (
        <ConfirmModal
          title="Dar de baja dictado"
          confirmLabel="Sí, dar de baja"
          message={
            <>
              ¿Estás seguro de que querés eliminar el dictado{' '}
              <strong className="text-gray-900">#{deleteTarget.course_no}</strong> de{' '}
              <strong className="text-gray-900">{capitalize(deleteTarget.sport?.name || '')}</strong>?
              Esta acción eliminará también las inscripciones asociadas.
            </>
          }
          loading={deleteLoading}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteTarget(null)
            setDeleteError(null)
          }}
        />
      )}
    </div>
  )
}