import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../modules/auth/authStore'
import {
  getCourses,
  getInscriptionsByClient,
  createInscription,
  deleteInscription,
} from './socio.api'
import type { Course, Inscription } from '../../shared/types'

export default function SportsSocio() {
  const navigate = useNavigate()
  const { client, logout } = useAuthStore()

  const [courses, setCourses] = useState<Course[]>([])
  const [myInscriptions, setMyInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    if (!client?.id) return
    let isMounted = true

    Promise.allSettled([getCourses(), getInscriptionsByClient(client.id)]).then(
      ([coursesRes, inscRes]) => {
        if (!isMounted) return
        if (coursesRes.status === 'fulfilled') {
          setCourses(coursesRes.value.data.data || [])
        } else {
          setError('No se pudieron cargar los deportes.')
        }
        if (inscRes.status === 'fulfilled') {
          setMyInscriptions(inscRes.value.data.data || [])
        }
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
    }
  }, [client?.id])

  // IDs de cursos en los que ya está inscripto el socio
  const inscribedCourseIds = useMemo(
    () => new Set(myInscriptions.map((i) => i.course?.id)),
    [myInscriptions]
  )

  // Agrupar cursos por deporte (filtrado por búsqueda)
  const groupedBySport = useMemo(() => {
    const filtered = courses.filter((c) =>
      (c.sport?.name || '').toLowerCase().includes(search.toLowerCase())
    )
    const map = new Map<string, Course[]>()
    for (const course of filtered) {
      const sportName = course.sport?.name || 'Sin deporte'
      if (!map.has(sportName)) map.set(sportName, [])
      map.get(sportName)!.push(course)
    }
    return map
  }, [courses, search])

  const handleInscribirse = async (course: Course) => {
    if (!client?.id) return
    setActionLoading(course.id)
    try {
      const res = await createInscription(course.id, client.id)
      setMyInscriptions((prev) => [...prev, res.data.data])
    } catch {
      // El backend valida cupo y duplicados; ignorar silenciosamente en el cliente
    } finally {
      setActionLoading(null)
    }
  }

  const handleDesinscribirse = async (course: Course) => {
    if (!client?.id) return
    setActionLoading(course.id)
    try {
      await deleteInscription(course.id, client.id)
      setMyInscriptions((prev) => prev.filter((i) => i.course?.id !== course.id))
    } catch {
      // Ignorar
    } finally {
      setActionLoading(null)
    }
  }

  function isFull(course: Course): boolean {
    const occupied = myInscriptions.filter((i) => i.course?.id === course.id).length
    return course.quota > 0 && occupied >= course.quota
  }

  const noResults = !loading && !error && groupedBySport.size === 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/socio')}
          className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
          title="Volver al menú principal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="font-semibold text-sm hidden sm:inline">Menú Socio</span>
        </button>

        <span className="font-semibold text-lg tracking-wide">Deportes disponibles</span>

        <button
          onClick={handleLogout}
          className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-md transition"
        >
          Cerrar sesión
        </button>
      </header>

      {/* Contenido */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex-1 space-y-6">
        {/* Buscador */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
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
            placeholder="Buscar deporte..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Estados: loading / error / sin resultados */}
        {loading && (
          <p className="text-center text-gray-500 py-16">Cargando deportes...</p>
        )}
        {error && !loading && (
          <p className="text-center text-red-600 py-16">{error}</p>
        )}
        {noResults && (
          <p className="text-center text-gray-500 py-16">
            No hay deportes que coincidan con tu búsqueda.
          </p>
        )}

        {/* Lista agrupada por deporte */}
        {!loading &&
          !error &&
          Array.from(groupedBySport.entries()).map(([sportName, sportCourses]) => (
            <section key={sportName} className="space-y-3">
              {/* Nombre del deporte como separador de sección */}
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
                {sportName}
              </h2>

              {/* Tarjetas de cursos */}
              {sportCourses.map((course) => {
                const isInscribed = inscribedCourseIds.has(course.id)
                const full = isFull(course)
                const isActing = actionLoading === course.id
                const cupoOcupado = myInscriptions.filter(
                  (i) => i.course?.id === course.id
                ).length
                const cupoTotal = course.quota
                const pct = cupoTotal > 0 ? Math.min((cupoOcupado / cupoTotal) * 100, 100) : 0

                return (
                  <div
                    key={course.id}
                    className={`bg-white border rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm transition ${
                      isInscribed
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {/* Info del curso */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-gray-900 text-base">
                          Turno #{course.course_no}
                        </p>
                        {isInscribed && (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            Inscripto
                          </span>
                        )}
                        {full && !isInscribed && (
                          <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            Sin cupo
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Horario:</span> {course.sched}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Profesor/a:</span> {course.professor}
                      </p>

                      {/* Barra de cupo */}
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">Cupo disponible</span>
                          <span
                            className={`text-xs font-semibold ${
                              full ? 'text-red-500' : 'text-gray-600'
                            }`}
                          >
                            {cupoOcupado} / {cupoTotal}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              full ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botón de acción */}
                    <div className="shrink-0">
                      {isInscribed ? (
                        <button
                          onClick={() => handleDesinscribirse(course)}
                          disabled={isActing}
                          className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {isActing ? '...' : 'Salir'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInscribirse(course)}
                          disabled={full || isActing}
                          className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isActing ? '...' : 'Inscribirse'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
      </main>
    </div>
  )
}

