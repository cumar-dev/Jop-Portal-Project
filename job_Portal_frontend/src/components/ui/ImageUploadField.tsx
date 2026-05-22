import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { uploadImage } from '../../api/upload'
import { ApiError } from '../../api/client'

const MAX_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ImageUploadFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  error?: string
  hint?: string
}

export function ImageUploadField({
  label = 'Job image',
  value,
  onChange,
  disabled,
  error,
  hint = 'JPG, PNG or WebP · max 10 MB',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function processFile(file: File) {
    setUploadError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image must be smaller than ${MAX_SIZE_MB} MB.`)
      return
    }

    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setUploadError(
        err instanceof ApiError
          ? err.message
          : 'Upload failed. Check your connection and Cloudinary settings.',
      )
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

  const displayError = error ?? uploadError

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img
            src={value}
            alt="Job preview"
            className="h-44 w-full object-cover sm:h-52"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/50 to-transparent" />
          <div className="absolute right-3 bottom-3 flex gap-2">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-white disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Replace
            </button>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-60"
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
          className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 transition ${
            dragOver
              ? 'border-brand-400 bg-brand-50'
              : displayError
                ? 'border-red-300 bg-red-50/50'
                : 'border-slate-200 bg-slate-50/80 hover:border-brand-300 hover:bg-brand-50/50'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
              <p className="mt-3 text-sm font-medium text-ink">Uploading image...</p>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <ImagePlus className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-muted">{hint}</p>
            </>
          )}
        </button>
      )}

      {hint && !displayError && !value && (
        <p className="text-xs text-muted">{hint}</p>
      )}
      {displayError && (
        <p className="text-xs text-red-600" role="alert">
          {displayError}
        </p>
      )}
    </div>
  )
}
