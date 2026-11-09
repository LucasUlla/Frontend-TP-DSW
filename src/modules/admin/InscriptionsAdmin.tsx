import { useState, useEffect, useMemo } from 'react'
import {
  getInscriptions,
  createInscriptionAdmin,
  deleteInscriptionAdmin,
  getCourses,
  getClients,
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
import InscriptionCreateModal from './components/InscriptionCreateModal'
import type { Inscription, Course, Client } from '../../shared/types'

export default function InscriptionsAdmin() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Inscription | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    Promise.all([getInscriptions(), getCourses(), getClients()])
      .then(([inscRes, coursesRes, clientsRes]) => {
        setInscriptions(inscRes.data.data || [])
        setCourses(coursesRes.data.data || [])
        setClients((clientsRes.data.data || []).filter((c) => c.type_user === 'Socio'))
      })
      .catch((err) =>
        setError(getApiErrorMessage(err, 'No se pudieron cargar las inscripciones.'))
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let ignore = false

    Promise.all([getInscriptions(), getCourses(), getClients()])
      .then(([inscRes, coursesRes, clientsRes]) => {
        if (ignore) return
        setInscriptions(inscRes.data.data || [])
        setCourses(coursesRes.data.data || [])
        setClients((clientsRes.data.data || []).filter((c) => c.type_user === 'Socio'))
      })
      .catch((err) => {
        if (!ignore) setError(getApiErrorMessage(err, 'No se pudieron cargar las inscripciones.'))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const filteredInscriptions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return inscriptions
    return inscriptions.filter((i) => {
      const clientName = `${i.client?.name || ''} ${i.client?.surname || ''}`.toLowerCase()
      const sportName = (i.course?.sport?.name || '').toLowerCase()
      const courseNo = String(i.course?.course_no || '')
      return clientName.includes(query) || sportName.includes(query) || courseNo.includes(query)
    })
  }, [inscriptions, search])

  const handleCreateInscription = async (courseId: number, clientId: number) => {
    const res = await createInscriptionAdmin(courseId, clientId)
    const course = courses.find((c) => c.id === courseId)
    const clientObj = clients.find((c) => c.id === clientId)
    const newInscription: Inscription = {
      ...res.data.data,
      course: course || res.data.data.course,
      client: clientObj || res.data.data.client,
    }
    setInscriptions((prev) => [...prev, newInscription])
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, inscriptionsCount: c.inscriptionsCount + 1 } : c
      )
    )
    setIsCreateOpen(false)
    setSuccessMessage(
      `${capitalize(newInscription.client?.name)} ${capitalize(newInscription.client?.surname)} fue inscripto correctamente.`
    )
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteInscriptionAdmin(deleteTarget.course.id, deleteTarget.client.id)
      setInscriptions((prev) =>
        prev.filter(
          (i) =>
            !(i.course.id === deleteTarget.course.id && i.client.id === deleteTarget.client.id)
        )
      )
      setCourses((prev) =>
        prev.map((c) =>
          c.id === deleteTarget.course.id
            ? { ...c, inscriptionsCount: Math.max(c.inscriptionsCount - 1, 0) }
            : c
        )
      )
      setSuccessMessage('La inscripción fue dada de baja correctamente.')
      setDeleteTarget(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Error al dar de baja la inscripción.'))
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
            <h1 className="text-2xl font-bold text-gray-800">Inscripciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestioná qué socios están inscriptos a cada dictado
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs text-center">
              <span className="text-xs text-gray-500 block">Total</span>
              <span className="text-lg font-bold text-gray-800">{inscriptions.length}</span>
            </div>

            <button
              type="button"
              disabled={courses.length === 0 || clients.length === 0}
              onClick={() => setIsCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span>Nueva Inscripción</span>
            </button>
          </div>
        </div>

        <SuccessBanner message={successMessage} onClose={() => setSuccessMessage(null)} />

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="relative">
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
              placeholder="Buscar por socio, deporte o N° de curso..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {loading && <AdminLoadingState text="Cargando inscripciones..." />}
        {error && !loading && <AdminErrorState error={error} onRetry={fetchData} />}

        {!loading && !error && filteredInscriptions.length === 0 && (
          <AdminEmptyState
            title="No se encontraron inscripciones"
            subtitle={
              search
                ? 'Probá con otro término de búsqueda.'
                : 'Todavía no hay socios inscriptos a ningún dictado.'
            }
          />
        )}

        {!loading && !error && filteredInscriptions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Socio</th>
                    <th className="px-6 py-3.5">Dictado</th>
                    <th className="px-6 py-3.5">Horario</th>
                    <th className="px-6 py-3.5">Fecha de inscripción</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInscriptions.map((insc) => (
                    <tr
                      key={`${insc.course.id}-${insc.client.id}`}
                      className="hover:bg-gray-50/80 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {capitalize(insc.client?.name)} {capitalize(insc.client?.surname)}
                        </div>
                        <div className="text-xs text-gray-500">DNI: {insc.client?.doc}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          {capitalize(insc.course?.sport?.name || '')} #{insc.course?.course_no}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm">
                        {formatSchedule(
                          insc.course?.days,
                          insc.course?.start_time,
                          insc.course?.end_time
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm">{formatDate(insc.insc_date)}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null)
                            setDeleteTarget(insc)
                          }}
                          className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition"
                        >
                          Dar de baja
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Mostrando <strong>{filteredInscriptions.length}</strong> de{' '}
                <strong>{inscriptions.length}</strong> inscripciones
              </span>
            </div>
          </div>
        )}
      </main>

      <InscriptionCreateModal
        isOpen={isCreateOpen}
        clients={clients}
        courses={courses}
        onClose={() => setIsCreateOpen(false)}
        onSubmitInscription={handleCreateInscription}
      />

      {deleteTarget && (
        <ConfirmModal
          title="Dar de baja inscripción"
          confirmLabel="Sí, dar de baja"
          message={
            <>
              ¿Estás seguro de que querés dar de baja la inscripción de{' '}
              <strong className="text-gray-900">
                {capitalize(deleteTarget.client?.name)} {capitalize(deleteTarget.client?.surname)}
              </strong>{' '}
              al curso <strong className="text-gray-900">#{deleteTarget.course?.course_no}</strong>{' '}
              de {capitalize(deleteTarget.course?.sport?.name || '')}?
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