import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../auth/authStore'
import { getInscriptionsByClient, deleteInscription } from './socio.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize, formatSchedule } from '../../shared/lib/formatters'
import { SVG_XMLNS } from '../../shared/constants'
import type { Inscription } from '../../shared/types'

export default function InscriptionsSocio() {
  const navigate = useNavigate()
  const { client, logout } = useAuthStore()

  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    if (!client?.id) return
    let ignore = false

    getInscriptionsByClient(client.id)
      .then((res) => {
        if (ignore) return
        setInscriptions(res.data.data || [])
      })
      .catch(() => {
        if (ignore) return
        setError('No se pudieron cargar tus inscripciones.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [client?.id])

  const handleDesinscribirse = async (courseId: number) => {
    if (!client?.id) return
    setActionLoading(courseId)
    setActionError(null)
    try {
      await deleteInscription(courseId, client.id)
      setInscriptions((prev) => prev.filter((i) => i.course?.id !== courseId))
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'No se pudo cancelar la inscripción.'))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white shadow-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/socio')}
          className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
          title="Volver al menú principal"
        >
          <svg xmlns={SVG_XMLNS} className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="font-semibold text-sm hidden sm:inline">Menú Socio</span>
        </button>

        <span className="font-semibold text-lg tracking-wide">Mis inscripciones</span>

        <button
          onClick={handleLogout}
          className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-md transition"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex-1 space-y-4">
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-red-700 hover:text-red-900 font-bold ml-4 shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {loading && <p className="text-center text-gray-500 py-16">Cargando tus inscripciones...</p>}
        {error && !loading && <p className="text-center text-red-600 py-16">{error}</p>}

        {!loading && !error && inscriptions.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3 shadow-sm">
            <p className="text-gray-500">Todavía no estás inscripto en ningún curso.</p>
            <button
              onClick={() => navigate('/socio/courses')}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Ver cursos disponibles
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          inscriptions.map((insc) => {
            const { course } = insc
            if (!course) return null
            const isActing = actionLoading === course.id
            const sportName = course.sport?.name ? capitalize(course.sport.name) : 'Curso'

            return (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      {sportName}
                    </span>
                    <p className="font-semibold text-gray-900 text-base">
                      Turno #{course.course_no}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Horario:</span>{' '}
                    {formatSchedule(course.days, course.start_time, course.end_time)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Profesor/a:</span> {course.professor}
                  </p>
                  {insc.insc_date && (
                    <p className="text-xs text-gray-400">
                      Inscripto el: {new Date(insc.insc_date).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleDesinscribirse(course.id)}
                    disabled={isActing}
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {isActing ? '...' : 'Salir'}
                  </button>
                </div>
              </div>
            )
          })}
      </main>
    </div>
  )
}