import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../auth/authStore'
import {
  getSports,
  createSport,
  updateSport,
  deleteSport,
} from './admin.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize } from '../../shared/lib/formatters'
import type { Sport } from '../../shared/types'

interface SportFormData {
  name: string
}

function parseSportErrorMessage(err: unknown, fallback: string): string {
  const msg = getApiErrorMessage(err, fallback)
  if (msg.toLowerCase().includes('duplicate entry')) {
    return 'Ya existe un deporte con ese nombre.'
  }
  return msg
}

export default function SportsAdmin() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Estados de modales
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingSport, setEditingSport] = useState<Sport | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Sport | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Alerta de éxito
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Forms de react-hook-form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate },
    setError: setErrorCreate,
  } = useForm<SportFormData>()

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
    setError: setErrorEdit,
  } = useForm<SportFormData>()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const fetchSports = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSports()
      setSports(res.data.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar los deportes.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSports()
  }, [])

  // Filtrar deportes por búsqueda
  const filteredSports = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sports
    return sports.filter((s) => s.name.toLowerCase().includes(query))
  }, [sports, search])

  // Crear deporte (Alta)
  const onSubmitCreate = async (data: SportFormData) => {
    try {
      const trimmedName = data.name.trim()
      const res = await createSport({ name: trimmedName })
      const newSport = res.data.data
      setSports((prev) => [...prev, newSport])
      setIsCreateOpen(false)
      resetCreate()
      setSuccessMessage(`El deporte "${capitalize(newSport.name)}" fue creado con éxito.`)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      const msg = parseSportErrorMessage(err, 'Error al crear el deporte.')
      setErrorCreate('name', { type: 'server', message: msg })
    }
  }

  // Abrir modal de edición (Modificación)
  const handleOpenEdit = (sport: Sport) => {
    setEditingSport(sport)
    setValueEdit('name', sport.name)
  }

  // Guardar cambios deporte (Modificación)
  const onSubmitEdit = async (data: SportFormData) => {
    if (!editingSport) return
    try {
      const trimmedName = data.name.trim()
      const res = await updateSport(editingSport.id, { name: trimmedName })
      const updated = res.data.data
      setSports((prev) =>
        prev.map((s) => (s.id === editingSport.id ? updated : s))
      )
      setEditingSport(null)
      resetEdit()
      setSuccessMessage(`El deporte "${capitalize(updated.name)}" fue actualizado con éxito.`)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      const msg = parseSportErrorMessage(err, 'Error al actualizar el deporte.')
      setErrorEdit('name', { type: 'server', message: msg })
    }
  }

  // Eliminar deporte (Baja)
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
      {/* Header institucional consistente con ListaClientes */}
      <header className="bg-blue-600 text-white shadow-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
          title="Volver al panel de administración"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 fill-current"
            viewBox="0 0 24 24"
          >
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

      {/* Contenido principal */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 space-y-6">
        {/* Título, botón de Alta y métrica */}
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
              onClick={() => {
                resetCreate()
                setIsCreateOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
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

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Barra de Búsqueda */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div className="relative flex-1">
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

        {/* Estados: Loading, Error, Vacío */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <p className="text-gray-500">Cargando lista de deportes...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center shadow-xs">
            <p className="font-semibold mb-2">Ocurrió un error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchSports}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filteredSports.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <p className="text-gray-500 font-medium">No se encontraron deportes</p>
            <p className="text-gray-400 text-sm mt-1">
              {search
                ? 'Probá con otro término de búsqueda.'
                : 'Aún no hay deportes registrados. Hacé click en "Nuevo Deporte" para crear el primero.'}
            </p>
          </div>
        )}

        {/* Tabla de Deportes */}
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
                      {/* ID */}
                      <td className="px-6 py-4 font-mono text-gray-500 text-xs sm:text-sm">
                        #{sport.id}
                      </td>

                      {/* Nombre con icono */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {sport.name ? sport.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 text-base">
                              {capitalize(sport.name)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sport)}
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

            {/* Footer de la tabla */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Mostrando <strong>{filteredSports.length}</strong> de <strong>{sports.length}</strong> deportes
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Alta: Nuevo Deporte */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  +
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Alta de Deporte</h3>
                  <p className="text-xs text-gray-500">Ingresá el nombre del nuevo deporte</p>
                </div>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del deporte *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Fútbol, Tenis, Natación..."
                  className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                    errorsCreate.name
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                  {...registerCreate('name', {
                    required: 'El nombre es obligatorio',
                    minLength: {
                      value: 2,
                      message: 'Debe tener al menos 2 caracteres',
                    },
                    maxLength: {
                      value: 50,
                      message: 'Máximo 50 caracteres',
                    },
                    validate: (value) =>
                      value.trim().length > 0 || 'El nombre no puede estar vacío',
                  })}
                />
                {errorsCreate.name && (
                  <p className="text-red-600 text-xs mt-1">{errorsCreate.name.message}</p>
                )}
              </div>

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
                  {isSubmittingCreate ? 'Creando...' : 'Crear Deporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Modificación: Editar Deporte */}
      {editingSport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  ✎
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Modificar Deporte</h3>
                  <p className="text-xs text-gray-500">ID #{editingSport.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSport(null)
                  resetEdit()
                }}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del deporte *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Básquet..."
                  className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                    errorsEdit.name
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                  {...registerEdit('name', {
                    required: 'El nombre es obligatorio',
                    minLength: {
                      value: 2,
                      message: 'Debe tener al menos 2 caracteres',
                    },
                    maxLength: {
                      value: 50,
                      message: 'Máximo 50 caracteres',
                    },
                    validate: (value) =>
                      value.trim().length > 0 || 'El nombre no puede estar vacío',
                  })}
                />
                {errorsEdit.name && (
                  <p className="text-red-600 text-xs mt-1">{errorsEdit.name.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSport(null)
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

      {/* Modal de Baja: Confirmación de Eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Dar de baja deporte</h3>
            </div>

            <p className="text-sm text-gray-600">
              ¿Estás seguro de que querés eliminar el deporte{' '}
              <strong className="text-gray-900">{capitalize(deleteTarget.name)}</strong> (ID #{deleteTarget.id})?
              Esta acción no se puede deshacer y afectará a los cursos y precios asociados.
            </p>

            {deleteError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteTarget(null)
                  setDeleteError(null)
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-xl text-sm transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl text-sm transition disabled:opacity-50"
              >
                {deleteLoading ? 'Eliminando...' : 'Sí, dar de baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

