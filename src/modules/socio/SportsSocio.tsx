import { useState, useEffect, useMemo } from 'react'
import { getSports } from './socio.api'
import { capitalize } from '../../shared/lib/formatters'
import SocioHeader from '../../shared/components/SocioHeader'
import SearchInput from '../../shared/components/SearchInput'
import type { Sport } from '../../shared/types'

export default function SportsSocio() {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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
      <SocioHeader title="Deportes del club" />

      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex-1 space-y-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar deporte..."
        />

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