import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ExternalLink, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { uploadCv } from '../../api/upload'
import { ApiError } from '../../api/client'

const MAX_SIZE_MB = 10
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function isCvFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf' || ext === 'docx') return true
  return ACCEPTED_TYPES.includes(file.type)
}

interface FileUploadFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  error?: string
  hint?: string
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|webp)/i.test(url) || (url.includes('/image/') && !/\.pdf/i.test(url))
}

export function FileUploadField({
  label = 'CV / Resume',
  value,
  onChange,
  disabled,
  error,
  hint = 'PDF or DOCX · max 10 MB',
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [storageNote, setStorageNote] = useState<string | null>(null)

  async function processFile(file: File) {
    setUploadError(null)
    setStorageNote(null)
    if (!isCvFile(file)) {
      setUploadError('Please upload a PDF or DOCX file for your CV.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File must be smaller than ${MAX_SIZE_MB} MB.`)
      return
    }

    setUploading(true)
    try {
      const result = await uploadCv(file)
      onChange(result.url)
      setPreviewUrl(result.viewUrl || result.url)
      setDownloadUrl(result.downloadUrl || result.viewUrl || result.url)
      setFileName(file.name)
      setStorageNote(
        result.cloudinaryFolder
          ? `Saved to Cloudinary (${result.cloudinaryFolder})`
          : 'Saved to Cloudinary',
      )
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleRemove() {
    onChange('')
    setFileName('')
    setPreviewUrl('')
    setDownloadUrl('')
    setStorageNote(null)
  }

  // Hide stale form validation once a file is uploaded successfully.
  const displayError = value ? uploadError : (error ?? uploadError)
  const openUrl = previewUrl || value

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          {isImageUrl(openUrl) ? (
            <img src={openUrl} alt="CV preview" className="mb-3 h-32 w-full rounded-lg object-cover" />
          ) : (
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-white p-3">
              <FileText className="h-8 w-8 shrink-0 text-brand-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {fileName || 'Document uploaded'}
                </p>
                <p className="text-xs text-muted">Ready to submit with your application</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {openUrl && (
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview
              </a>
            )}
            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50"
              >
                Download
              </a>
            )}
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Replace
            </button>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled && !uploading) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition ${
            dragOver
              ? 'border-emerald-400 bg-emerald-50'
              : displayError
                ? 'border-red-300 bg-red-50/50'
                : 'border-slate-200 bg-slate-50/80 hover:border-emerald-300 hover:bg-emerald-50/40'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
              <p className="mt-2 text-sm font-medium text-ink">Uploading your CV...</p>
            </>
          ) : (
            <>
              <FileText className="h-9 w-9 text-emerald-600" />
              <p className="mt-2 text-sm font-semibold text-ink">Upload your CV</p>
              <p className="mt-1 text-xs text-muted">{hint}</p>
            </>
          )}
        </button>
      )}

      {storageNote && !displayError && (
        <p
          className={`text-xs ${
            storageNote.includes('Cloudinary') ? 'text-emerald-700' : 'text-amber-800'
          }`}
          role="status"
        >
          {storageNote}
        </p>
      )}
      {displayError && (
        <p className="text-xs text-red-600" role="alert">
          {displayError}
        </p>
      )}
    </div>
  )
}
