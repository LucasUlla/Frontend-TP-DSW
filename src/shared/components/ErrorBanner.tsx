interface ErrorBannerProps {
  message: string | null
  onClose: () => void
}

export default function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  if (!message) return null

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-red-700 hover:text-red-900 font-bold ml-4 shrink-0"
      >
        ✕
      </button>
    </div>
  )
}