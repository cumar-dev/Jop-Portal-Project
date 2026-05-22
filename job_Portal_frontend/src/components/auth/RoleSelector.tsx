import { Building2, UserRound } from 'lucide-react'
import type { UserRole } from '../../types/auth'

interface RoleSelectorProps {
  value: UserRole
  onChange: (role: UserRole) => void
  disabled?: boolean
}

const roles: { value: UserRole; label: string; description: string; icon: typeof UserRound }[] = [
  {
    value: 'Applicant',
    label: 'Job seeker',
    description: 'Browse roles and apply with your profile',
    icon: UserRound,
  },
  {
    value: 'Employer',
    label: 'Employer',
    description: 'Post jobs and review applications',
    icon: Building2,
  },
]

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium text-ink">I am joining as</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map(({ value: roleValue, label, description, icon: Icon }) => {
          const selected = value === roleValue
          return (
            <button
              key={roleValue}
              type="button"
              onClick={() => onChange(roleValue)}
              className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition ${
                selected
                  ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/15'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              aria-pressed={selected}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  selected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {description}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
