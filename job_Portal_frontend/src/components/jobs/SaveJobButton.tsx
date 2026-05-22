import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { removeSavedJob, saveJob } from '../../api/savedJobs'
import { ApiError } from '../../api/client'

interface SaveJobButtonProps {
  jobId: string
  saved: boolean
  onChange?: (saved: boolean) => void
  /** Icon-only for cards; full label for detail pages */
  variant?: 'icon' | 'button'
  className?: string
}

export function SaveJobButton({
  jobId,
  saved: savedProp,
  onChange,
  variant = 'icon',
  className = '',
}: SaveJobButtonProps) {
  const [saved, setSaved] = useState(savedProp)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSaved(savedProp)
  }, [savedProp])

  const isSaved = onChange ? savedProp : saved

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      if (isSaved) {
        await removeSavedJob(jobId)
        setSaved(false)
        onChange?.(false)
      } else {
        await saveJob(jobId)
        setSaved(true)
        onChange?.(true)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update saved job')
    } finally {
      setLoading(false)
    }
  }

  const baseClass =
    variant === 'icon'
      ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-60'
      : 'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:opacity-60'

  const savedClass = isSaved
    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
    : 'border-slate-200 bg-white text-muted hover:border-slate-300 hover:bg-slate-50 hover:text-ink'

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={isSaved ? 'Remove from saved jobs' : 'Save job'}
        aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
        aria-pressed={isSaved}
        className={`${baseClass} ${savedClass}`}
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        {variant === 'button' && (isSaved ? 'Saved' : 'Save job')}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
