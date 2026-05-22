import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface AlertProps {
  variant: 'error' | 'success'
  message: string
}

export function Alert({ variant, message }: AlertProps) {
  const isError = variant === 'error'
  const Icon = isError ? AlertCircle : CheckCircle2

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}
