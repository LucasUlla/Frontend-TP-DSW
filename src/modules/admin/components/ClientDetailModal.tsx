import { capitalize, formatDate } from '../../../shared/lib/formatters'
import type { Client } from '../../../shared/types'

interface ClientDetailModalProps {
  client: Client | null
  onClose: () => void
}

export default function ClientDetailModal({ client, onClose }: ClientDetailModalProps) {
  if (!client) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
              {client.name ? client.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {capitalize(client.name)} {capitalize(client.surname)}
              </h3>
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                  client.type_user === 'Admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {client.type_user === 'Admin' ? 'Administrador' : 'Socio'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">ID de Sistema</span>
            <span className="font-mono font-medium text-gray-800">{client.id}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">DNI</span>
            <span className="font-mono font-medium text-gray-800">{client.doc || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-800 break-all">{client.email}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Fecha de Nacimiento</span>
            <span className="font-medium text-gray-800">
              {formatDate(client.birth_date, 'No registrada')}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-xl text-sm transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}