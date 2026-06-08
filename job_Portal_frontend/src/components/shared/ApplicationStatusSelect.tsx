import { useId } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import {
  APPLICATION_STATUSES,
  getStatusStyles,
  statusLabel,
  type ApplicationStatus,
} from '../../lib/applicationStatus'

interface ApplicationStatusSelectProps {
  value: ApplicationStatus
  onChange: (status: ApplicationStatus) => void
  disabled?: boolean
  loading?: boolean
  /** Fits narrow table cells without overflowing adjacent columns */
  compact?: boolean
  className?: string
  id?: string
}

export function ApplicationStatusSelect({
  value,
  onChange,
  disabled,
  loading,
  compact = false,
  className = '',
  id,
}: ApplicationStatusSelectProps) {
  const generatedId = useId()
  const styles = getStatusStyles(value)
  const selectId = id ?? generatedId

  const wrapperClass = compact
    ? 'relative w-full min-w-0 max-w-full'
    : 'relative inline-flex w-full min-w-0 max-w-[11rem]'

  const selectClass = compact
    ? 'py-1.5 pr-8 pl-2.5 text-xs'
    : 'py-2 pr-9 pl-3 text-sm'

  return (
    <div className={`${wrapperClass} ${className}`}>
      <label htmlFor={selectId} className="sr-only">
        Application status
      </label>
      <select
        id={selectId}
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value as ApplicationStatus)}
        className={`w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-border bg-card font-medium text-ink shadow-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60 ${selectClass} ${styles.select}`}
        aria-label="Update application status"
      >
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>
      {loading ? (
        <Loader2
          className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400"
          aria-hidden
        />
      ) : (
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden
        />
      )}
    </div>
  )
}
