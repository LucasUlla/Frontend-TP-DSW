import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../auth/authStore'
import { getCourses, getInscriptionsByClient, createInscription, deleteInscription } from './socio.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize } from '../../shared/lib/formatters'
import SocioHeader from '../../shared/components/SocioHeader'
import SearchInput from '../../shared/components/SearchInput'
import ErrorBanner from '../../shared/components/ErrorBanner'
import CourseCard from './components/CourseCard'
import type { Course, Inscription } from '../../shared/types'

export default function CoursesSocio() {
  const { client } = useAuthStore()

  const [courses, setCourses] = useState<Course[]>([])
  const [myInscriptions, setMyInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!client?.id) return
    let ignore = false

    Promise.allSettled([getCourses(), getInscriptionsByClient(client.id)]).then(
      ([coursesRes, inscRes]) => {
        if (ignore) return

        if (coursesRes.status === 'fulfilled') {
          setCourses(coursesRes.value.data.data || [])
        } else {
          setError('No se pudieron cargar los cursos.')
        }

        if (inscRes.status === 'fulfilled') {
          setMyInscriptions(inscRes.value.data.data || [])
        }

        setLoading(false)
      }
    )

    return () => {
      ignore = true
    }
  }, [client?.id])

  const inscribedCourseIds = useMemo(
    () => new Set(myInscriptions.map((i) => i.course?.id)),
    [myInscriptions]
  )

  const groupedBySport = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = courses.filter((c) => {
      const sportName = (c.sport?.name || '').toLowerCase()
      const profName = (c.professor || '').toLowerCase()
      return sportName.includes(q) || profName.includes(q)
    })
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
    setActionError(null)
    try {
      const res = await createInscription(course.id, client.id)
      setMyInscriptions((prev) => [...prev, res.data.data])
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, inscriptionsCount: c.inscriptionsCount + 1 } : c))
      )
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'No se pudo completar la inscripción.'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDesinscribirse = async (course: Course) => {
    if (!client?.id) return
    setActionLoading(course.id)
    setActionError(null)
    try {
      await deleteInscription(course.id, client.id)
      setMyInscriptions((prev) => prev.filter((i) => i.course?.id !== course.id))
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, inscriptionsCount: Math.max(c.inscriptionsCount - 1, 0) } : c
        )
      )
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'No se pudo cancelar la inscripción.'))
    } finally {
      setActionLoading(null)
    }
  }

  const noResults = !loading && !error && groupedBySport.size === 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SocioHeader title="Cursos disponibles" />

      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex-1 space-y-6">
        <ErrorBanner message={actionError} onClose={() => setActionError(null)} />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar curso por deporte o profesor..."
        />

        {loading && <p className="text-center text-gray-500 py-16">Cargando cursos...</p>}
        {error && !loading && <p className="text-center text-red-600 py-16">{error}</p>}
        {noResults && (
          <p className="text-center text-gray-500 py-16">
            No hay cursos que coincidan con tu búsqueda.
          </p>
        )}

        {!loading &&
          !error &&
          Array.from(groupedBySport.entries()).map(([sportName, sportCourses]) => (
            <section key={sportName} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
                {capitalize(sportName)}
              </h2>

              {sportCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isInscribed={inscribedCourseIds.has(course.id)}
                  isActing={actionLoading === course.id}
                  showQuota={true}
                  onSubscribe={handleInscribirse}
                  onUnsubscribe={handleDesinscribirse}
                />
              ))}
            </section>
          ))}
      </main>
    </div>
  )
}