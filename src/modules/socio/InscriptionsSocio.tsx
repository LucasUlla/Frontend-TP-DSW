import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../auth/authStore'
import { getInscriptionsByClient, deleteInscription } from './socio.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import SocioHeader from '../../shared/components/SocioHeader'
import ErrorBanner from '../../shared/components/ErrorBanner'
import CourseCard from './components/CourseCard'
import type { Course, Inscription } from '../../shared/types'

export default function InscriptionsSocio() {
  const navigate = useNavigate()
  const { client } = useAuthStore()

  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  const handleDesinscribirse = async (course: Course) => {
    if (!client?.id) return
    setActionLoading(course.id)
    setActionError(null)
    try {
      await deleteInscription(course.id, client.id)
      setInscriptions((prev) => prev.filter((i) => i.course?.id !== course.id))
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'No se pudo cancelar la inscripción.'))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SocioHeader title="Mis inscripciones" />

      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex-1 space-y-4">
        <ErrorBanner message={actionError} onClose={() => setActionError(null)} />

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
            if (!insc.course) return null
            return (
              <CourseCard
                key={insc.course.id}
                course={insc.course}
                isInscribed={true}
                isActing={actionLoading === insc.course.id}
                showQuota={false}
                showSportBadge={true}
                inscDate={insc.insc_date}
                onUnsubscribe={handleDesinscribirse}
              />
            )
          })}
      </main>
    </div>
  )
}