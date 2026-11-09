import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../auth/authStore'
import { getSports } from './socio.api'
import { capitalize } from '../../shared/lib/formatters'
import { SVG_XMLNS } from '../../shared/constants'
import type { Sport } from '../../shared/types'

export default function SportsSocio() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    let ignore = false

    getSports()
      .then((res) => {
        if (ignore) return
        setSports(res.data.data || [])
      })
      .catch(() => {
        if (ignore) return
        setError('No se pudieron cargar los deportes del club.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const filteredSports = useMemo(() => {
    return sports.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [sports, search])

  const noResults = !loading && !error && filteredSports.length === 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white shadow-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/socio')}
          className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
          title="Volver al menú principal"
        >
          <svg xmlns={SVG_XMLNS} className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="font-semibold text-sm hidden sm:inline">Menú Socio</span>
        </button>

        <span className="font-semibold text-lg tracking-wide">Deportes del club</span>

        <button
          onClick={handleLogout}
          className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-md transition"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex-1 space-y-6">
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
            placeholder="Buscar deporte..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {loading && <p className="text-center text-gray-500 py-16">Cargando deportes...</p>}
        {error && !loading && <p className="text-center text-red-600 py-16">{error}</p>}
        {noResults && (
          <p className="text-center text-gray-500 py-16">
            {sports.length === 0
              ? 'No hay deportes cargados en el club.'
              : 'No hay deportes que coincidan con tu búsqueda.'}
          </p>
        )}

        {!loading && !error && filteredSports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredSports.map((sport) => (
              <div
                key={sport.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between"
              >
                <span className="font-semibold text-gray-900 text-base">
                  {capitalize(sport.name)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}