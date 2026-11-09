import { useState, useEffect, useMemo } from 'react'
import { getSports, createSport, updateSport, deleteSport } from './admin.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize } from '../../shared/lib/formatters'
import { SVG_XMLNS } from '../../shared/constants'
import AdminHeader from '../../shared/components/AdminHeader'
import SuccessBanner from '../../shared/components/SucessBanner'
import ConfirmModal from '../../shared/components/ConfirmModal'
import {
  AdminLoadingState,
  AdminErrorState,
  AdminEmptyState,
} from '../../shared/components/AdminStatusStates'
import SportFormModal from './components/SportFormModal'
import type { Sport } from '../../shared/types'

export default function SportsAdmin() {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingSport, setEditingSport] = useState<Sport | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Sport | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchSports = () => {
    setLoading(true)
    setError(null)
    getSports()
      .then((res) => setSports(res.data.data || []))
      .catch((err) => setError(getApiErrorMessage(err, 'No se pudieron cargar los deportes.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let ignore = false

    getSports()
      .then((res) => {
        if (!ignore) setSports(res.data.data || [])
      })
      .catch((err) => {
        if (!ignore) setError(getApiErrorMessage(err, 'No se pudieron cargar los deportes.'))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const filteredSports = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sports
    return sports.filter((s) => s.name.toLowerCase().includes(query))
  }, [sports, search])

  const handleSubmitSport = async (name: string) => {
    if (editingSport) {
      const res = await updateSport(editingSport.id, { name })
      const updated = res.data.data
      setSports((prev) => prev.map((s) => (s.id === editingSport.id ? updated : s)))
      setEditingSport(null)
      setSuccessMessage(`El deporte "${capitalize(updated.name)}" fue actualizado con éxito.`)
    } else {
      const res = await createSport({ name })
      const newSport = res.data.data
      setSports((prev) => [...prev, newSport])
      setIsCreateOpen(false)
      setSuccessMessage(`El deporte "${capitalize(newSport.name)}" fue creado con éxito.`)
    }
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteSport(deleteTarget.id)
      setSports((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setSuccessMessage(`El deporte "${capitalize(deleteTarget.name)}" fue eliminado correctamente.`)
      setDeleteTarget(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Error al eliminar el deporte.'))
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
            <h1 className="text-2xl font-bold text-gray-800">Lista de Deportes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Administrá el catálogo de deportes del club (alta, modificación y baja)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs text-center">
              <span className="text-xs text-gray-500 block">Total</span>
              <span className="text-lg font-bold text-gray-800">{sports.length}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 text-sm"
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
              <span>Nuevo Deporte</span>
            </button>
          </div>
        </div>

        <SuccessBanner message={successMessage} onClose={() => setSuccessMessage(null)} />

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
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
              placeholder="Buscar deporte por nombre..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {loading && <AdminLoadingState text="Cargando lista de deportes..." />}
        {error && !loading && <AdminErrorState error={error} onRetry={fetchSports} />}

        {!loading && !error && filteredSports.length === 0 && (
          <AdminEmptyState
            title="No se encontraron deportes"
            subtitle={
              search
                ? 'Probá con otro término de búsqueda.'
                : 'Aún no hay deportes registrados. Hacé click en "Nuevo Deporte" para crear el primero.'
            }
          />
        )}

        {!loading && !error && filteredSports.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 w-24">ID</th>
                    <th className="px-6 py-3.5">Nombre del Deporte</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSports.map((sport) => (
                    <tr key={sport.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-mono text-gray-500 text-xs sm:text-sm">
                        #{sport.id}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {sport.name ? sport.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="font-semibold text-gray-900 text-base">
                            {capitalize(sport.name)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingSport(sport)}
                            className="text-amber-700 hover:text-amber-900 font-medium text-xs bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-md transition"
                          >
                            Modificar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteTarget(sport)
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
                Mostrando <strong>{filteredSports.length}</strong> de{' '}
                <strong>{sports.length}</strong> deportes
              </span>
            </div>
          </div>
        )}
      </main>

      <SportFormModal
        isOpen={isCreateOpen || Boolean(editingSport)}
        editingSport={editingSport}
        onClose={() => {
          setIsCreateOpen(false)
          setEditingSport(null)
        }}
        onSubmitSport={handleSubmitSport}
      />

      {deleteTarget && (
        <ConfirmModal
          title="Dar de baja deporte"
          confirmLabel="Sí, dar de baja"
          message={
            <>
              ¿Estás seguro de que querés eliminar el deporte{' '}
              <strong className="text-gray-900">{capitalize(deleteTarget.name)}</strong> (ID #
              {deleteTarget.id})? Esta acción no se puede deshacer y afectará a los cursos y precios
              asociados.
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