import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../modules/auth/authStore'
import { SVG_XMLNS } from '../constants'

export default function AdminHeader() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
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
  )
}