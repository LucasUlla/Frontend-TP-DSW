import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../modules/auth/authStore.ts'

const socioOptions = [
  { label: 'Ver deportes', path: '/socio/sports', description: 'Explorá los deportes disponibles' },
  { label: 'Ver cursos', path: '/socio/courses', description: 'Consultá los cursos del club' },
  { label: 'Mis inscripciones', path: '/socio/inscriptions', description: 'Revisá tus inscripciones activas' },
  { label: 'Mis cuotas', path: '/socio/fees', description: 'Consultá el estado de tus pagos' },
  { label: 'Mi perfil', path: '/socio/profile', description: 'Editá tus datos personales' },
]

export default function MenuSocio() {
  const navigate = useNavigate()
  const { client, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Hola, {client?.name}</h1>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {socioOptions.map((option) => (
            <button
              key={option.path}
              onClick={() => navigate(option.path)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition text-left"
            >
              <h2 className="font-semibold text-lg">{option.label}</h2>
              <p className="text-gray-500 text-sm mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}