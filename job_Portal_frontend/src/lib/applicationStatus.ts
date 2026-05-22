export const APPLICATION_STATUSES = ['Pending', 'Reviewed', 'Accepted', 'Rejected'] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export function normalizeApplicationStatus(value: unknown): ApplicationStatus {
  const s = String(value ?? '').trim()
  const match = APPLICATION_STATUSES.find(
    (status) => status.toLowerCase() === s.toLowerCase(),
  )
  return match ?? 'Pending'
}

export function statusLabel(status: ApplicationStatus): string {
  return status
}

const statusStyles: Record<
  ApplicationStatus,
  { badge: string; dot: string; select: string }
> = {
  Pending: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    dot: 'bg-amber-500',
    select: 'border-amber-300 text-amber-900 focus:border-amber-500 focus:ring-amber-500/20',
  },
  Reviewed: {
    badge: 'bg-sky-50 text-sky-800 ring-sky-200/80',
    dot: 'bg-sky-500',
    select: 'border-sky-300 text-sky-900 focus:border-sky-500 focus:ring-sky-500/20',
  },
  Accepted: {
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
    dot: 'bg-emerald-500',
    select: 'border-emerald-300 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-500/20',
  },
  Rejected: {
    badge: 'bg-red-50 text-red-800 ring-red-200/80',
    dot: 'bg-red-500',
    select: 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500/20',
  },
}

export function getStatusStyles(status: ApplicationStatus) {
  return statusStyles[status]
}

export function countByStatus<T extends { status: ApplicationStatus }>(
  items: T[],
): Record<ApplicationStatus, number> {
  const counts: Record<ApplicationStatus, number> = {
    Pending: 0,
    Reviewed: 0,
    Accepted: 0,
    Rejected: 0,
  }
  for (const item of items) {
    counts[item.status] += 1
  }
  return counts
}
