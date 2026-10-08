import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../auth/authStore'
import {
  getInscriptions,
  createInscriptionAdmin,
  deleteInscriptionAdmin,
  getCourses,
  getClients,
} from './admin.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize, formatSchedule } from '../../shared/lib/formatters'
import { SVG_XMLNS } from '../../shared/constants'
import ConfirmModal from '../../shared/components/ConfirmModal'
import type { Inscription, Course, Client } from '../../shared/types'

interface InscriptionFormData {
  client: number
  course: number
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

export default function InscriptionsAdmin() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [clientSearch, setClientSearch] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<Inscription | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionFormData>()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Usado por el botón "Reintentar"
  const fetchData = () => {
    setLoading(true)
    setError(null)
    Promise.all([getInscriptions(), getCourses(), getClients()])
      .then(([inscRes, coursesRes, clientsRes]) => {
        setInscriptions(inscRes.data.data || [])
        setCourses(coursesRes.data.data || [])
        setClients((clientsRes.data.data || []).filter((c) => c.type_user === 'Socio'))
      })
      .catch((err) => setError(getApiErrorMessage(err, 'No se pudieron cargar las inscripciones.')))
      .finally(() => setLoading(false))
  }

  // Carga inicial — lógica inline en el efecto
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

  const filteredClientOptions = useMemo(() => {
    const query = clientSearch.trim().toLowerCase()
    if (!query) return clients
    return clients.filter((c) => {
      const fullName = `${c.name || ''} ${c.surname || ''}`.toLowerCase()
      return fullName.includes(query) || (c.doc || '').includes(query)
    })
  }, [clients, clientSearch])

  const onSubmitCreate = async (data: InscriptionFormData) => {
  setCreateError(null)
  try {
    const res = await createInscriptionAdmin(Number(data.course), Number(data.client))
    const course = courses.find((c) => c.id === Number(data.course))
    const clientObj = clients.find((c) => c.id === Number(data.client))
    const newInscription: Inscription = {
      ...res.data.data,
      course: course || res.data.data.course,
      client: clientObj || res.data.data.client,
    }
    setInscriptions((prev) => [...prev, newInscription])
    // Actualizamos el cupo localmente para que el select lo refleje sin recargar
    setCourses((prev) =>
      prev.map((c) =>
        c.id === Number(data.course) ? { ...c, inscriptionsCount: c.inscriptionsCount + 1 } : c
      )
    )
    setIsCreateOpen(false)
    reset()
    setClientSearch('')
    setSuccessMessage(
      `${capitalize(newInscription.client?.name)} ${capitalize(newInscription.client?.surname)} fue inscripto correctamente.`
    )
    setTimeout(() => setSuccessMessage(null), 4000)
  } catch (err) {
    setCreateError(getApiErrorMessage(err, 'Error al crear la inscripción.'))
  }
}

  const handleDelete = async () => {
  if (!deleteTarget) return
  setDeleteLoading(true)
  setDeleteError(null)
  try {
    await deleteInscriptionAdmin(deleteTarget.course.id, deleteTarget.client.id)
    setInscriptions((prev) =>
      prev.filter(
        (i) => !(i.course.id === deleteTarget.course.id && i.client.id === deleteTarget.client.id)
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
              onClick={() => {
                reset()
                setCreateError(null)
                setClientSearch('')
                setIsCreateOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns={SVG_XMLNS} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Inscripción</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
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

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <p className="text-gray-500">Cargando inscripciones...</p>
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

        {!loading && !error && filteredInscriptions.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <p className="text-gray-500 font-medium">No se encontraron inscripciones</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Probá con otro término de búsqueda.' : 'Todavía no hay socios inscriptos a ningún dictado.'}
            </p>
          </div>
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
                    <tr key={`${insc.course.id}-${insc.client.id}`} className="hover:bg-gray-50/80 transition">
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
                        {formatSchedule(insc.course?.days, insc.course?.start_time, insc.course?.end_time)}
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
                Mostrando <strong>{filteredInscriptions.length}</strong> de <strong>{inscriptions.length}</strong> inscripciones
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Alta */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Nueva Inscripción</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false)
                  reset()
                }}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4" noValidate>
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
                    errors.client ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
                  }`}
                  {...register('client', { required: 'Seleccioná un socio' })}
                >
                  {filteredClientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {capitalize(c.name)} {capitalize(c.surname)} — DNI {c.doc}
                    </option>
                  ))}
                </select>
                {errors.client && <p className="text-red-600 text-xs mt-1">{errors.client.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dictado *</label>
                <select
                    className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                    errors.course ? 'border-red-500 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
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
                        {capitalize(c.sport?.name || '')} #{c.course_no} — {formatSchedule(c.days, c.start_time, c.end_time)}
                        {' '}({c.inscriptionsCount}/{c.quota}){full ? ' — SIN CUPO' : ''}
                        </option>
                    )
                    })}
                </select>
                {errors.course && <p className="text-red-600 text-xs mt-1">{errors.course.message}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false)
                    reset()
                  }}
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
      )}

      {/* Modal de Baja */}
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
              al curso <strong className="text-gray-900">#{deleteTarget.course?.course_no}</strong> de{' '}
              {capitalize(deleteTarget.course?.sport?.name || '')}?
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