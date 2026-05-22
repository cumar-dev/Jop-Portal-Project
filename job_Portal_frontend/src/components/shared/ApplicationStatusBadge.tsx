import { getStatusStyles, statusLabel, type ApplicationStatus } from '../../lib/applicationStatus'

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export function ApplicationStatusBadge({ status, className = '' }: ApplicationStatusBadgeProps) {
  const styles = getStatusStyles(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
      {statusLabel(status)}
    </span>
  )
}
