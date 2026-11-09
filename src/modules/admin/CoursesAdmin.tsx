import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getSports,
} from './admin.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize, formatSchedule, formatDate } from '../../shared/lib/formatters'
import { SVG_XMLNS } from '../../shared/constants'
import AdminHeader from '../../shared/components/AdminHeader'
import SuccessBanner from '../../shared/components/SucessBanner'
import ConfirmModal from '../../shared/components/ConfirmModal'
import {
  AdminLoadingState,
  AdminErrorState,
  AdminEmptyState,
} from '../../shared/components/AdminStatusStates'
import CourseFormModal from './components/CourseFormModal'
import type { Course, CoursePayload, Sport } from '../../shared/types'

export default function CoursesAdmin() {
  const navigate = useNavigate()

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

  const handleSubmitCourse = async (payload: CoursePayload) => {
    const matchingSport = sports.find((s) => s.id === payload.sport)

    if (editingCourse) {
      const res = await updateCourse(editingCourse.id, payload)
      const updated: Course = {
        ...res.data.data,
        sport: matchingSport || res.data.data.sport,
      }
      setCourses((prev) => prev.map((c) => (c.id === editingCourse.id ? updated : c)))
      setEditingCourse(null)
      setSuccessMessage(`El dictado #${updated.course_no} fue actualizado con éxito.`)
    } else {
      const res = await createCourse(payload)
      const newCourse: Course = {
        ...res.data.data,
        sport: matchingSport || res.data.data.sport,
      }
      setCourses((prev) => [...prev, newCourse])
      setIsCreateOpen(false)
      setSuccessMessage(`El dictado #${newCourse.course_no} fue creado con éxito.`)
    }
    setTimeout(() => setSuccessMessage(null), 4000)
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />

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
              onClick={() => setIsCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={sports.length === 0 ? 'Primero creá al menos un deporte' : undefined}
            >
              <svg
                xmlns={SVG_XMLNS}
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Dictado</span>
            </button>
          </div>
        </div>

        <SuccessBanner message={successMessage} onClose={() => setSuccessMessage(null)} />

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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
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
            onChange={(e) =>
              setSportFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
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

        {loading && <AdminLoadingState text="Cargando dictados..." />}
        {error && !loading && <AdminErrorState error={error} onRetry={fetchData} />}

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
          <AdminEmptyState
            title="No se encontraron dictados"
            subtitle={
              search || sportFilter !== 'ALL'
                ? 'Probá ajustando los filtros.'
                : 'Hacé click en "Nuevo Dictado" para crear el primero.'
            }
          />
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
                      <td className="px-6 py-4 text-xs sm:text-sm">
                        {formatSchedule(course.days, course.start_time, course.end_time)}
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm">
                        {formatDate(course.start_date)} — {formatDate(course.finish_date)}
                      </td>
                      <td className="px-6 py-4">{course.quota}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCourse(course)}
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
                Mostrando <strong>{filteredCourses.length}</strong> de{' '}
                <strong>{courses.length}</strong> dictados
              </span>
            </div>
          </div>
        )}
      </main>

      <CourseFormModal
        isOpen={isCreateOpen || Boolean(editingCourse)}
        editingCourse={editingCourse}
        sports={sports}
        onClose={() => {
          setIsCreateOpen(false)
          setEditingCourse(null)
        }}
        onSubmitCourse={handleSubmitCourse}
      />

      {deleteTarget && (
        <ConfirmModal
          title="Dar de baja dictado"
          confirmLabel="Sí, dar de baja"
          message={
            <>
              ¿Estás seguro de que querés eliminar el dictado{' '}
              <strong className="text-gray-900">#{deleteTarget.course_no}</strong> de{' '}
              <strong className="text-gray-900">
                {capitalize(deleteTarget.sport?.name || '')}
              </strong>
              ? Esta acción eliminará también las inscripciones asociadas.
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