/**
 * Convierte un texto a Capitalize (cada palabra con su primera letra en mayúscula y el resto en minúscula).
 * Ejemplo: "juan carlos" -> "Juan Carlos", "PEREZ" -> "Perez"
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatSchedule(days: string[], startTime: string, endTime: string): string {
  if (!days || days.length === 0) return '—'
  return `${days.join(' y ')} de ${startTime} a ${endTime}`
}

