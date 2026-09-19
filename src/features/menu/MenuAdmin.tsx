import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../modules/auth/authStore.ts'

const adminOptions = [
  { label: 'Clientes', path: '/admin/clients', description: 'Gestioná socios y administradores' },
  { label: 'Deportes', path: '/admin/sports', description: 'Alta, baja y modificación de deportes' },
  { label: 'Cursos', path: '/admin/courses', description: 'Gestioná los cursos ofrecidos' },
  { label: 'Precios', path: '/admin/prices', description: 'Configurá precios y tarifas' },
  { label: 'Inscripciones', path: '/admin/inscriptions', description: 'Revisá inscripciones de socios' },
  { label: 'Cuotas', path: '/admin/fees', description: 'Gestioná cuotas y pagos' },
]

export default function MenuAdmin() {
  const navigate = useNavigate()
  const { client, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="bg-blue-600 text-white mb-10 shadow-sm px-6 h-14 flex items-center justify-between">
        <span className="font-semibold tracking-wide">Panel de administración</span>
        <button
          onClick={handleLogout}
          className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-md transition"
        >
          Cerrar sesión
        </button>
      </header>


      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Menú principal</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {adminOptions.map((option) => (
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