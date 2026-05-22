import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { downloadCvFile, openCvInBrowser } from '../../api/files'
import { ApiError } from '../../api/client'

interface CvActionButtonsProps {
  applicationId?: string
  fileName?: string
  className?: string
  /** Compact pill buttons for data tables */
  compact?: boolean
  /** Stack compact buttons vertically (narrow table cells) */
  stacked?: boolean
}

export function CvActionButtons({
  applicationId,
  fileName = 'cv.pdf',
  className = '',
  compact = false,
  stacked = false,
}: CvActionButtonsProps) {
  const [loading, setLoading] = useState<'view' | 'download' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!applicationId) return null

  async function handleView() {
    setError(null)
    setLoading('view')
    try {
      await openCvInBrowser(applicationId!)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open CV')
    } finally {
      setLoading(null)
    }
  }

  async function handleDownload() {
    setError(null)
    setLoading('download')
    try {
      await downloadCvFile(applicationId!, fileName)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not download CV')
    } finally {
      setLoading(null)
    }
  }

  const btnClass = compact
    ? 'inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60'
    : 'inline-flex items-center gap-1.5 text-sm font-medium disabled:opacity-60'

  return (
    <div className={className}>
      <div
        className={`flex ${compact ? (stacked ? 'flex-col gap-1' : 'flex-nowrap gap-1.5') : 'flex-wrap gap-3'}`}
      >
        <button
          type="button"
          onClick={handleView}
          disabled={loading !== null}
          className={
            compact
              ? btnClass
              : `${btnClass} text-brand-600 hover:text-brand-700`
          }
        >
          {loading === 'view' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ExternalLink className="h-3 w-3" />
          )}
          View
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading !== null}
          className={
            compact
              ? btnClass
              : `${btnClass} text-muted hover:text-ink`
          }
        >
          {loading === 'download' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Download
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
