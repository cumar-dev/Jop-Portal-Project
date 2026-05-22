import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  variant?: 'primary' | 'emerald' | 'ghost'
}

export function Button({
  children,
  loading,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60'

  const sizeStyles =
    variant === 'ghost'
      ? 'w-full px-4 py-3 text-sm'
      : 'min-h-[44px] w-full px-6 py-3 text-[15px] sm:w-auto sm:min-w-[12.5rem]'

  const styles =
    variant === 'emerald'
      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:ring-emerald-500/25'
      : variant === 'primary'
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 focus-visible:ring-brand-500/30'
        : 'bg-transparent text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-100/20'

  return (
    <button
      className={`${base} ${sizeStyles} ${styles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
