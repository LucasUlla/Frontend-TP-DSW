interface LoadingBoxProps {
  text: string
}

export function AdminLoadingState({ text }: LoadingBoxProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
      <p className="text-gray-500">{text}</p>
    </div>
  )
}

interface ErrorBoxProps {
  error: string
  onRetry: () => void
}

export function AdminErrorState({ error, onRetry }: ErrorBoxProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center shadow-xs">
      <p className="font-semibold mb-2">Ocurrió un error</p>
      <p className="text-sm">{error}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
      >
        Reintentar
      </button>
    </div>
  )
}

interface EmptyBoxProps {
  title: string
  subtitle: string
}

export function AdminEmptyState({ title, subtitle }: EmptyBoxProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
      <p className="text-gray-500 font-medium">{title}</p>
      <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
    </div>
  )
}