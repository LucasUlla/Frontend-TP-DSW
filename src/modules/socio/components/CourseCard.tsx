import { capitalize, formatSchedule } from '../../../shared/lib/formatters'
import type { Course } from '../../../shared/types'

interface CourseCardProps {
  course: Course
  isInscribed: boolean
  isActing: boolean
  showQuota?: boolean
  showSportBadge?: boolean
  inscDate?: string
  onSubscribe?: (course: Course) => void
  onUnsubscribe: (course: Course) => void
}

export default function CourseCard({
  course,
  isInscribed,
  isActing,
  showQuota = true,
  showSportBadge = false,
  inscDate,
  onSubscribe,
  onUnsubscribe,
}: CourseCardProps) {
  const cupoOcupado = course.inscriptionsCount ?? 0
  const cupoTotal = course.quota
  const full = cupoTotal > 0 && cupoOcupado >= cupoTotal
  const pct = cupoTotal > 0 ? Math.min((cupoOcupado / cupoTotal) * 100, 100) : 0
  const sportName = course.sport?.name ? capitalize(course.sport.name) : 'Curso'

  return (
    <div
      className={`bg-white border rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm transition ${
        isInscribed && showQuota
          ? 'border-blue-200 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          {showSportBadge && (
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              {sportName}
            </span>
          )}
          <p className="font-semibold text-gray-900 text-base">
            Turno #{course.course_no}
          </p>
          {isInscribed && showQuota && (
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              Inscripto
            </span>
          )}
          {full && !isInscribed && showQuota && (
            <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
              Sin cupo
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600">
          <span className="font-medium">Horario:</span>{' '}
          {formatSchedule(course.days, course.start_time, course.end_time)}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Profesor/a:</span> {course.professor}
        </p>

        {inscDate && (
          <p className="text-xs text-gray-400 mt-1">
            Inscripto el: {new Date(inscDate).toLocaleDateString('es-AR')}
          </p>
        )}

        {showQuota && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">Cupo disponible</span>
              <span className={`text-xs font-semibold ${full ? 'text-red-500' : 'text-gray-600'}`}>
                {cupoOcupado} / {cupoTotal}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  full ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0">
        {isInscribed ? (
          <button
            onClick={() => onUnsubscribe(course)}
            disabled={isActing}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            {isActing ? '...' : 'Salir'}
          </button>
        ) : (
          onSubscribe && (
            <button
              onClick={() => onSubscribe(course)}
              disabled={full || isActing}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isActing ? '...' : 'Inscribirse'}
            </button>
          )
        )}
      </div>
    </div>
  )
}