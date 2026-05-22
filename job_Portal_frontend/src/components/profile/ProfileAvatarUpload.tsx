import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Camera, Loader2, Trash2, User } from 'lucide-react'
import { fetchProfilePhotoBlob } from '../../api/profile'
import { uploadProfileImage } from '../../api/upload'
import { ApiError } from '../../api/client'
import {
  getProfileImageCandidates,
  getProfileImageDisplayUrl,
} from '../../lib/profileImage'

const MAX_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ProfileAvatarUploadProps {
  imageUrl: string
  storedUrl: string
  fullName: string
  onChange: (storedUrl: string, viewUrl: string) => void
  onUploadSaved?: (storedUrl: string, viewUrl: string) => void | Promise<void>
  disabled?: boolean
  error?: string
}

export function ProfileAvatarUpload({
  imageUrl,
  storedUrl,
  fullName,
  onChange,
  onUploadSaved,
  disabled,
  error,
}: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const skipNextSyncRef = useRef(false)
  const fallbackAttemptedRef = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [srcIndex, setSrcIndex] = useState(0)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [localBlobPreview, setLocalBlobPreview] = useState('')

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const displayError = error ?? uploadError
  const hasStoredImage = Boolean(storedUrl?.trim() || imageUrl?.trim())

  const candidates = useMemo(
    () => getProfileImageCandidates(imageUrl, storedUrl),
    [imageUrl, storedUrl],
  )

  const imageSrc = candidates[srcIndex] ?? ''
  const showImage = Boolean(imageSrc) && !previewFailed

  function revokeBlobUrl() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  function setBlobPreview(url: string) {
    revokeBlobUrl()
    if (url.startsWith('blob:')) {
      blobUrlRef.current = url
    }
    setLocalBlobPreview(url)
    setPreviewFailed(false)
  }

  useEffect(() => () => revokeBlobUrl(), [])

  useEffect(() => {
    setSrcIndex(0)
    setPreviewFailed(false)
    fallbackAttemptedRef.current = false
  }, [candidates.join('|')])

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false
      return
    }

    if (!imageUrl && !storedUrl) {
      revokeBlobUrl()
      setLocalBlobPreview('')
      setPreviewFailed(false)
    }
  }, [imageUrl, storedUrl])

  async function loadAuthenticatedFallback() {
    if (!hasStoredImage || localBlobPreview || fallbackAttemptedRef.current) return
    fallbackAttemptedRef.current = true
    try {
      const blobUrl = await fetchProfilePhotoBlob()
      setBlobPreview(blobUrl)
    } catch {
      setPreviewFailed(true)
    }
  }

  function handleImgError() {
    if (localBlobPreview) return
    if (srcIndex + 1 < candidates.length) {
      setSrcIndex((i) => i + 1)
      return
    }
    void loadAuthenticatedFallback()
  }

  async function processFile(file: File) {
    setUploadError(null)
    setPreviewFailed(false)
    fallbackAttemptedRef.current = false

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image must be smaller than ${MAX_SIZE_MB} MB.`)
      return
    }

    const localPreview = URL.createObjectURL(file)
    setBlobPreview(localPreview)
    setUploading(true)

    try {
      const result = await uploadProfileImage(file)
      const stored = result.url.trim()
      const view = getProfileImageDisplayUrl(result.viewUrl, stored)

      skipNextSyncRef.current = true
      onChange(stored, view)
      revokeBlobUrl()
      setLocalBlobPreview('')
      setSrcIndex(0)
      setPreviewFailed(false)

      if (onUploadSaved) {
        await onUploadSaved(stored, view)
      }
    } catch (err) {
      onChange('', '')
      revokeBlobUrl()
      setLocalBlobPreview('')
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

  function handleRemove() {
    revokeBlobUrl()
    setLocalBlobPreview('')
    setPreviewFailed(false)
    setSrcIndex(0)
    fallbackAttemptedRef.current = false
    onChange('', '')
  }

  const previewSrc = localBlobPreview || imageSrc
  const showPreview = Boolean(previewSrc) && (localBlobPreview ? true : showImage)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-border bg-subtle shadow-md">
          {showPreview ? (
            <img
              key={`${srcIndex}-${previewSrc}`}
              src={previewSrc}
              alt=""
              className="h-full w-full object-cover"
              onError={handleImgError}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-brand-100 text-2xl font-bold text-brand-700 dark:bg-brand-100/20 dark:text-brand-400">
              {initials || <User className="h-12 w-12 text-muted" />}
            </span>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="absolute right-0 bottom-0 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-brand-600 text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60"
          aria-label="Upload profile photo"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
      </div>

      <div className="flex-1 text-center sm:text-left">
        <p className="text-sm font-medium text-ink">Profile photo</p>
        <p className="mt-1 text-xs text-muted">JPG, PNG or WebP · max 10 MB</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-subtle disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {hasStoredImage || showPreview ? 'Change photo' : 'Upload photo'}
          </button>
          {(hasStoredImage || showPreview) && (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
        {displayError && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {displayError}
          </p>
        )}
      </div>
    </div>
  )
}
