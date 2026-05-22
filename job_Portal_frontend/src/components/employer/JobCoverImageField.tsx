import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { fetchUploadImagePreviewBlob, uploadJobImage } from '../../api/upload'
import { ApiError } from '../../api/client'
import { withCloudinaryCoverTransform } from '../../lib/job'

const MAX_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = ['jpg', 'jpeg', 'png', 'webp']

function isAcceptedImage(file: File) {
  if (ACCEPTED_TYPES.includes(file.type)) return true
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ACCEPTED_EXT.includes(ext)
}

interface JobCoverImageFieldProps {
  value: string
  signedViewUrl?: string
  onChange: (url: string) => void
  onUploadingChange?: (uploading: boolean) => void
  disabled?: boolean
  error?: string
  /** Taller sidebar layout for the post-job form grid */
  compact?: boolean
}

export function JobCoverImageField({
  value,
  signedViewUrl,
  onChange,
  onUploadingChange,
  disabled,
  error,
  compact = false,
}: JobCoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const skipNextValueSyncRef = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [storageNote, setStorageNote] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')

  function revokeBlobUrl() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  function setPreview(url: string) {
    revokeBlobUrl()
    if (url.startsWith('blob:')) {
      blobUrlRef.current = url
    }
    setPreviewSrc(url)
    setPreviewFailed(false)
  }

  useEffect(() => () => revokeBlobUrl(), [])

  useEffect(() => {
    onUploadingChange?.(uploading)
  }, [uploading, onUploadingChange])

  // Load preview when editing an existing job (not right after a fresh upload).
  useEffect(() => {
    if (skipNextValueSyncRef.current) {
      skipNextValueSyncRef.current = false
      return
    }

    if (!value) {
      revokeBlobUrl()
      setPreviewSrc('')
      setPreviewFailed(false)
      return
    }

    let cancelled = false
    setLoadingPreview(true)
    setPreviewFailed(false)

    async function loadPreview() {
      const direct = signedViewUrl?.startsWith('http') ? signedViewUrl : value

      if (direct.includes('res.cloudinary.com')) {
        if (!cancelled) setPreviewSrc(withCloudinaryCoverTransform(direct, 1200, 500))
        return
      }

      try {
        const blobUrl = await fetchUploadImagePreviewBlob(value)
        if (!cancelled) setPreview(blobUrl)
      } catch {
        if (!cancelled) {
          setPreviewSrc('')
          setPreviewFailed(true)
        }
      }
    }

    void loadPreview().finally(() => {
      if (!cancelled) setLoadingPreview(false)
    })

    return () => {
      cancelled = true
    }
  }, [value, signedViewUrl])

  async function processFile(file: File) {
    setUploadError(null)
    setStorageNote(null)
    setPreviewFailed(false)

    if (!isAcceptedImage(file)) {
      setUploadError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image must be smaller than ${MAX_SIZE_MB} MB.`)
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setUploading(true)

    try {
      const result = await uploadJobImage(file)
      skipNextValueSyncRef.current = true
      onChange(result.url)
      setPreview(
        result.viewUrl.includes('res.cloudinary.com')
          ? withCloudinaryCoverTransform(result.viewUrl, 1200, 500)
          : result.viewUrl,
      )
      setStorageNote(
        result.cloudinaryFolder
          ? `Saved to Cloudinary (${result.cloudinaryFolder})`
          : 'Saved to Cloudinary (job-portal/jobs)',
      )
    } catch (err) {
      onChange('')
      revokeBlobUrl()
      setPreviewSrc('')
      setUploadError(
        err instanceof ApiError ? err.message : 'Upload failed. Please try again.',
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

  function handleImgError() {
    if (blobUrlRef.current) {
      setPreviewSrc(blobUrlRef.current)
      return
    }
    if (signedViewUrl?.startsWith('http')) {
      setPreviewSrc(signedViewUrl)
      return
    }
    setPreviewFailed(true)
  }

  const displayError = value ? uploadError : (error ?? uploadError)
  const showCover = Boolean(value) || Boolean(previewSrc)
  const showPreviewImage = Boolean(previewSrc) && !previewFailed
  const aspectClass = compact ? 'aspect-[4/3]' : 'aspect-[2.4/1] sm:aspect-[21/9]'

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        aria-label="Upload cover image"
      />

      {showCover ? (
        <div className={`relative w-full overflow-hidden bg-slate-100 ${aspectClass}`}>
          {showPreviewImage ? (
            <>
              <img
                src={previewSrc}
                alt="Job cover"
                className="h-full w-full object-cover"
                onError={handleImgError}
              />
              {(uploading || loadingPreview) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
              )}
            </>
          ) : loadingPreview || uploading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-200 px-4 text-center">
              <ImagePlus className="h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">
                Cover preview unavailable — click Change cover to upload again
              </p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              Cover image
            </span>
          </div>
          <div className="absolute right-4 bottom-4 flex gap-2">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-ink shadow-md transition hover:bg-slate-50 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Change cover
            </button>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => {
                skipNextValueSyncRef.current = false
                onChange('')
                revokeBlobUrl()
                setPreviewSrc('')
                setPreviewFailed(false)
                setStorageNote(null)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
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
          className={`flex w-full flex-col items-center justify-center border-b-2 border-dashed transition ${aspectClass} ${
            dragOver
              ? 'border-brand-400 bg-brand-50'
              : displayError
                ? 'border-red-300 bg-red-50'
                : 'border-slate-200 bg-linear-to-br from-slate-50 to-brand-50/40 hover:border-brand-300'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
              <p className="mt-3 text-sm font-medium text-ink">Uploading cover...</p>
            </>
          ) : (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                <ImagePlus className="h-7 w-7" />
              </span>
              <p className="mt-4 text-base font-semibold text-ink">Add cover image</p>
              <p className="mt-1 text-sm text-muted">
                This appears at the top of your job listing
              </p>
              <p className="mt-2 text-xs text-muted">JPG, PNG or WebP · max 10 MB</p>
            </>
          )}
        </button>
      )}

      {storageNote && !displayError && (
        <p className="bg-emerald-50 px-6 py-2 text-xs text-emerald-700" role="status">
          {storageNote}
        </p>
      )}
      {displayError && (
        <p className="bg-red-50 px-6 py-2 text-xs text-red-600" role="alert">
          {displayError}
        </p>
      )}
    </div>
  )
}
