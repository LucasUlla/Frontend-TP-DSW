import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../auth/authStore'
import { getClients, deleteClient } from './admin.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize } from '../../shared/lib/formatters'
import type { Client, TypeUser } from '../../shared/types'

function formatDate(birthDateString?: string): string {
  if (!birthDateString) return 'No registrada'
  const parts = birthDateString.split('T')[0].split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
  }
  const date = new Date(birthDateString)
  return isNaN(date.getTime()) ? birthDateString : date.toLocaleDateString('es-AR')
}

export default function ListaClientes() {
  const navigate = useNavigate()
  const { client: currentAdmin, logout } = useAuthStore()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<'ALL' | TypeUser>('ALL')

  // Modales
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getClients()
      setClients(res.data.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar los clientes.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Filtrar clientes por búsqueda y rol
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesRole =
        selectedRole === 'ALL' ? true : c.type_user === selectedRole

      const query = search.trim().toLowerCase()
      if (!query) return matchesRole

      const fullName = `${c.name || ''} ${c.surname || ''}`.toLowerCase()
      const docMatch = (c.doc || '').toLowerCase().includes(query)
      const emailMatch = (c.email || '').toLowerCase().includes(query)
      const nameMatch = fullName.includes(query)

      return matchesRole && (nameMatch || docMatch || emailMatch)
    })
  }, [clients, search, selectedRole])

  // Contadores para resumen
  const totalCount = clients.length
  const socioCount = useMemo(
    () => clients.filter((c) => c.type_user === 'Socio').length,
    [clients]
  )
  const adminCount = useMemo(
    () => clients.filter((c) => c.type_user === 'Admin').length,
    [clients]
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteClient(deleteTarget.id)
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setSuccessMessage(`El cliente ${capitalize(deleteTarget.name)} ${capitalize(deleteTarget.surname)} fue eliminado correctamente.`)
      setDeleteTarget(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Error al eliminar el cliente.'))
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header institucional consistente */}
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
        {/* Título y estadísticas rápidas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lista de Clientes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Consultá y administrá todos los socios y administradores registrados
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs text-center">
              <span className="text-xs text-gray-500 block">Total</span>
              <span className="text-lg font-bold text-gray-800">{totalCount}</span>
            </div>
            <div className="bg-white border border-blue-100 px-3.5 py-2 rounded-xl shadow-xs text-center">
              <span className="text-xs text-blue-600 block font-medium">Socios</span>
              <span className="text-lg font-bold text-blue-700">{socioCount}</span>
            </div>
            <div className="bg-white border border-purple-100 px-3.5 py-2 rounded-xl shadow-xs text-center">
              <span className="text-xs text-purple-600 block font-medium">Admins</span>
              <span className="text-lg font-bold text-purple-700">{adminCount}</span>
            </div>
          </div>
        </div>

        {/* Mensaje de éxito al eliminar */}
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

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Input de Búsqueda */}
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
              placeholder="Buscar por nombre, apellido, DNI o email..."
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

          {/* Selector de Rol */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectedRole('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedRole === 'ALL'
                  ? 'bg-white text-gray-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('Socio')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedRole === 'Socio'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-600 hover:text-blue-700'
              }`}
            >
              Socios ({socioCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('Admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedRole === 'Admin'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-gray-600 hover:text-purple-700'
              }`}
            >
              Admins ({adminCount})
            </button>
          </div>
        </div>

        {/* Estados: Loading, Error, Vacío */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <p className="text-gray-500">Cargando lista de clientes...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center shadow-xs">
            <p className="font-semibold mb-2">Ocurrió un error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchClients}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filteredClients.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
            <p className="text-gray-500 font-medium">No se encontraron clientes</p>
            <p className="text-gray-400 text-sm mt-1">
              {search
                ? 'Probá ajustando los términos de búsqueda o el filtro de rol.'
                : 'No hay clientes registrados en el sistema.'}
            </p>
          </div>
        )}

        {/* Tabla de Clientes (Desktop y Tablet) */}
        {!loading && !error && filteredClients.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Cliente</th>
                    <th className="px-6 py-3.5">DNI</th>
                    <th className="px-6 py-3.5">Fecha Nacimiento</th>
                    <th className="px-6 py-3.5">Rol</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map((client) => {
                    const isCurrentAdmin = currentAdmin?.id === client.id

                    return (
                      <tr key={client.id} className="hover:bg-gray-50/80 transition">
                        {/* Nombre y Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {capitalize(client.name)} {capitalize(client.surname)}
                                {isCurrentAdmin && (
                                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-medium">
                                    Vos
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{client.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Documento */}
                        <td className="px-6 py-4 font-mono text-gray-800 text-xs sm:text-sm">
                          {client.doc || '—'}
                        </td>

                        {/* Fecha de nacimiento */}
                        <td className="px-6 py-4 text-xs sm:text-sm">
                          {formatDate(client.birth_date)}
                        </td>

                        {/* Rol */}
                        <td className="px-6 py-4">
                          {client.type_user === 'Admin' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              Administrador
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              Socio
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewClient(client)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition"
                            >
                              Ver detalle
                            </button>

                            <button
                              type="button"
                              disabled={isCurrentAdmin}
                              onClick={() => {
                                setDeleteError(null)
                                setDeleteTarget(client)
                              }}
                              className={`text-xs px-2.5 py-1.5 rounded-md transition font-medium ${
                                isCurrentAdmin
                                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100'
                              }`}
                              title={
                                isCurrentAdmin
                                  ? 'No podés eliminar tu propia cuenta'
                                  : 'Eliminar cliente'
                              }
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer de la tabla */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Mostrando <strong>{filteredClients.length}</strong> de <strong>{totalCount}</strong> clientes
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Detalle de Cliente */}
      {viewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                  {viewClient.name ? viewClient.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {capitalize(viewClient.name)} {capitalize(viewClient.surname)}
                  </h3>
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                      viewClient.type_user === 'Admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {viewClient.type_user === 'Admin' ? 'Administrador' : 'Socio'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewClient(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">ID de Sistema</span>
                <span className="font-mono font-medium text-gray-800">{viewClient.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">DNI</span>
                <span className="font-mono font-medium text-gray-800">{viewClient.doc || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-800 break-all">{viewClient.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Fecha de Nacimiento</span>
                <span className="font-medium text-gray-800">{formatDate(viewClient.birth_date)}</span>
              </div>
              {viewClient.phone && (
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="font-medium text-gray-800">{viewClient.phone}</span>
                </div>
              )}
              {viewClient.address && (
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Dirección</span>
                  <span className="font-medium text-gray-800">{viewClient.address}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewClient(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-xl text-sm transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
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
              <h3 className="text-lg font-bold text-gray-900">Confirmar eliminación</h3>
            </div>

            <p className="text-sm text-gray-600">
              ¿Estás seguro de que querés eliminar al cliente{' '}
              <strong className="text-gray-900">
                {capitalize(deleteTarget.name)} {capitalize(deleteTarget.surname)}
              </strong>{' '}
              (DNI: {deleteTarget.doc})? Esta acción eliminará permanentemente sus datos, cuotas e inscripciones asociadas.
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
                {deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

