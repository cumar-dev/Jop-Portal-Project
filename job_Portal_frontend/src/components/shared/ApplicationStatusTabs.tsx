import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  APPLICATION_STATUSES,
  countByStatus,
  type ApplicationStatus,
} from '../../lib/applicationStatus'

type FilterValue = 'All' | ApplicationStatus

interface ApplicationStatusTabsProps {
  items: { status: ApplicationStatus }[]
  active: FilterValue
  onChange: (filter: FilterValue) => void
}

const filterLabels: Record<FilterValue, string> = {
  All: 'All',
  Pending: 'Pending',
  Reviewed: 'Reviewed',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
}

export function ApplicationStatusTabs({
  items,
  active,
  onChange,
}: ApplicationStatusTabsProps) {
  const selectId = useId()
  const counts = countByStatus(items)
  const options: FilterValue[] = ['All', ...APPLICATION_STATUSES]

  function optionLabel(tab: FilterValue): string {
    const count = tab === 'All' ? items.length : counts[tab as ApplicationStatus]
    return `${filterLabels[tab]} (${count})`
  }

  return (
    <div className="relative inline-flex min-w-[11rem]">
      <label htmlFor={selectId} className="sr-only">
        Filter by application status
      </label>
      <select
        id={selectId}
        value={active}
        onChange={(e) => onChange(e.target.value as FilterValue)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-card py-2 pr-9 pl-3 text-sm font-medium text-ink shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        aria-label="Filter by application status"
      >
        {options.map((tab) => (
          <option key={tab} value={tab}>
            {optionLabel(tab)}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
    </div>
  )
}
