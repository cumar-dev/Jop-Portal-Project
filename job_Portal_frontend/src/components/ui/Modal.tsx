import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
  xl?: boolean
  cover?: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
  xl,
  cover,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${
          xl ? 'max-w-5xl' : wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        {cover}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition hover:bg-subtle hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
