import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  accent?: 'blue' | 'emerald' | 'amber' | 'violet'
}

const accents = {
  blue: 'bg-brand-50 text-brand-600 dark:bg-brand-100/20 dark:text-brand-500',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
}

export function StatCard({ label, value, icon: Icon, trend, accent = 'blue' }: StatCardProps) {
  return (
    <article className="app-panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
          {trend && <p className="mt-2 text-xs text-muted">{trend}</p>}
        </div>
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </article>
  )
}
