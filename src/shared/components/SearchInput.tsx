import { SVG_XMLNS } from '../constants'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
}: SearchInputProps) {
  return (
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
    </div>
  )
}