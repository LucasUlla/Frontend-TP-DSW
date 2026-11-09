interface SuccessBannerProps {
  message: string | null
  onClose: () => void
}

export default function SuccessBanner({ message, onClose }: SuccessBannerProps) {
  if (!message) return null

  return (
    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
      >
        ✕
      </button>
    </div>
  )
}