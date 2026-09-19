import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../modules/auth/authStore'
import { getInscriptionsByClient, getFeesByClient, updateClientProfile } from './socio.api'
import { getApiErrorMessage } from '../../shared/lib/api.Error'
import { capitalize } from '../../shared/lib/formatters'
import type { Fee, Inscription } from '../../shared/types'

function calculateAge(birthDateString?: string): number | null {
  if (!birthDateString) return null
  const parts = birthDateString.split('T')[0].split('-')
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    const birth = new Date(year, month, day)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  }
  const date = new Date(birthDateString)
  if (isNaN(date.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const m = today.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

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

export default function ProfileSocio() {
  const navigate = useNavigate()
  const { client, setAuth, logout, token } = useAuthStore()

  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para el modal de edición
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: client?.name || '',
    surname: client?.surname || '',
    phone: client?.phone || '',
    address: client?.address || '',
    birth_date: client?.birth_date ? client.birth_date.split('T')[0] : '',
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!client?.id) return

    let isMounted = true

    Promise.allSettled([
      getInscriptionsByClient(client.id),
      getFeesByClient(client.id),
    ]).then(([inscRes, feesRes]) => {
      if (!isMounted) return
      if (inscRes.status === 'fulfilled') {
        setInscriptions(inscRes.value.data.data || [])
      }
      if (feesRes.status === 'fulfilled') {
        setFees(feesRes.value.data.data || [])
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [client?.id])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleOpenEdit = () => {
    setEditForm({
      name: client?.name || '',
      surname: client?.surname || '',
      phone: client?.phone || '',
      address: client?.address || '',
      birth_date: client?.birth_date ? client.birth_date.split('T')[0] : '',
    })
    setSaveError(null)
    setIsEditing(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client?.id) return

    setSaveLoading(true)
    setSaveError(null)

    const formattedName = capitalize(editForm.name)
    const formattedSurname = capitalize(editForm.surname)

    try {
      const res = await updateClientProfile(client.id, {
        name: formattedName,
        surname: formattedSurname,
        birth_date: editForm.birth_date,
      })

      const updatedClient = {
        ...client,
        ...res.data.data,
        name: formattedName,
        surname: formattedSurname,
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        birth_date: editForm.birth_date,
      }

      setAuth(updatedClient, token)
      setIsEditing(false)
    } catch (err: unknown) {
      setSaveError(getApiErrorMessage(err, 'Error al guardar los cambios del perfil.'))
    } finally {
      setSaveLoading(false)
    }
  }

  const age = calculateAge(client?.birth_date)
  const hasPendingFees = fees.some((f) => !f.paid)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra superior con navegación Home */}
      <header className="bg-blue-600 text-white mb-10 shadow-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/socio')}
          className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
          title="Volver al menú principal"
        >
          {/* Home Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="font-semibold text-sm hidden sm:inline">Menú Socio</span>
        </button>

        
      </header>

      {/* Contenedor principal */}
      <main className="max-w-4xl w-full mx-auto p-6 md:p-10 flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
          {/* Fila superior: Avatar, Datos básicos y Botón Cerrar Sesión */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              {/* Foto de perfil con botón lápiz */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-blue-100 border-2 border-gray-300 flex items-center justify-center overflow-hidden shadow-inner">
                  {/* Avatar SVG ilustrativo */}
                  <svg
                    className="w-20 h-20 text-blue-400 mt-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                {/* Botón Lápiz de edición */}
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="absolute bottom-1 right-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 p-2 rounded-full shadow-md transition"
                  title="Editar perfil"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>

              {/* Nombre, Documento y Número de socio */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {client ? `${client.name} ${client.surname}` : 'Cargando...'}
                </h1>
                <p className="text-gray-700 text-base">
                  <span className="font-semibold">Documento:</span>{' '}
                  {client?.type_doc || 'DNI'} {client?.doc}
                </p>
                <p className="text-gray-700 text-base">
                  <span className="font-semibold">Núm. de socio:</span>{' '}
                  {client?.type_user === 'Socio' ? client.id : 'No es socio'}
                </p>
              </div>
            </div>

            {/* Botón Cerrar Sesión del mockup */}
            <div className="hidden sm:block">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition uppercase text-sm tracking-wider"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Información complementaria: Fecha de nacimiento, Teléfono, Dirección, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800 text-base pt-2">
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Fecha de nacimiento:</span>{' '}
                {formatDate(client?.birth_date)}{' '}
                {age !== null && <span className="text-gray-600">({age} años)</span>}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{' '}
                {client?.email || 'No registrado'}
              </p>
              <p>
                <span className="font-semibold">Teléfono:</span>{' '}
                {client?.phone || '+54 9 341-123456'}
              </p>
              <p>
                <span className="font-semibold">Dirección:</span>{' '}
                {client?.address || 'Cerrito 1234'}
              </p>
            </div>

            <div className="flex md:justify-end items-start">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Estado:</span>
                {loading ? (
                  <span className="text-gray-400 text-sm">Verificando...</span>
                ) : hasPendingFees ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                    Cuotas pendientes
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    Al día
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => navigate('/socio/fees')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-lg shadow hover:shadow-md transition uppercase text-sm tracking-wide text-center"
            >
              Ver pagos anteriores
            </button>
            <button
              onClick={() => navigate('/socio/fees')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-lg shadow hover:shadow-md transition uppercase text-sm tracking-wide text-center"
            >
              Pagar cuotas
            </button>
          </div>

          {/* Sección "Mis deportes" */}
          <section className="pt-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pb-2 border-b-2 border-gray-900">
              Mis deportes
            </h2>

            <div className="py-8">
              {loading ? (
                <p className="text-center text-gray-500 py-6">
                  Cargando deportes inscriptos...
                </p>
              ) : inscriptions.length === 0 ? (
                <p className="text-center font-bold text-lg text-gray-900 py-8">
                  No estás inscripto a ningún deporte
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inscriptions.map((insc, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-5 hover:border-blue-500 transition shadow-sm bg-gray-50"
                    >
                      <h3 className="font-bold text-lg text-gray-900">
                        {insc.course?.sport?.name || `Curso #${insc.course?.course_no}`}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Horarios:</span>{' '}
                        {insc.course?.sched}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        <span className="font-medium">Profesor/a:</span>{' '}
                        {insc.course?.professor}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Modal de edición de perfil */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Editar Datos Personales</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {saveError && (
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                {saveError}
              </p>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.surname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, surname: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  required
                  value={editForm.birth_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, birth_date: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  placeholder="+54 9 341-123456"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Cerrito 1234"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {saveLoading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

