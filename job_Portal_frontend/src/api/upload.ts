import { getToken } from '../lib/authStorage'
import { ApiError } from './client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5046'

interface UploadResponse {
  message?: string
  url?: string
  secureUrl?: string
  viewUrl?: string
  downloadUrl?: string
  publicId?: string
  cloudinaryFolder?: string
  resourceType?: string
  storageProvider?: string
  Url?: string
  SecureUrl?: string
  ViewUrl?: string
  DownloadUrl?: string
}

interface CloudinaryDirectResponse {
  secure_url?: string
  url?: string
  public_id?: string
  resource_type?: string
  error?: { message?: string }
}

interface UploadConfigResponse {
  cloudName?: string
  imageUploadPreset?: string
  rawUploadPreset?: string
  directUploadEnabled?: boolean
  folders?: {
    cvs?: string
    jobs?: string
    companies?: string
    profiles?: string
  }
}

export interface UploadResult {
  /** Canonical URL to store in MongoDB */
  url: string
  /** URL safe to use in img/src and preview links */
  viewUrl: string
  downloadUrl: string
  publicId?: string
  cloudinaryFolder?: string
  resourceType?: string
}

let uploadConfigCache: UploadConfigResponse | null = null

function pickString(...values: (string | undefined)[]): string {
  for (const v of values) {
    const trimmed = v?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function simplifyCloudinaryError(message: string): string {
  if (
    message.includes('missing permissions') ||
    message.includes('actions=["create"]') ||
    message.includes('cannot upload files')
  ) {
    return (
      'Cloudinary API key cannot upload via the server. Create unsigned upload presets ' +
      '"job_portal_images" and "job_portal_cvs" in Cloudinary Console → Settings → Upload, ' +
      'or enable Upload permission on your API key.'
    )
  }
  if (message.includes('Invalid API key') || message.includes('Invalid Signature')) {
    return 'Cloudinary API key or secret is wrong. Copy fresh credentials from your Cloudinary dashboard.'
  }
  if (message.includes('Upload preset not found') || message.includes('Invalid upload preset')) {
    return (
      'Cloudinary upload preset is missing. In Cloudinary Console → Settings → Upload, ' +
      'create unsigned presets named job_portal_images (images) and job_portal_cvs (raw/PDF).'
    )
  }
  return message
}

function parseUploadError(text: string, status: number): string {
  if (!text) {
    if (status === 401) return 'Session expired. Please sign in again and retry your upload.'
    if (status === 403) return 'You do not have permission to upload this file type.'
    return 'Upload failed'
  }

  try {
    const json = JSON.parse(text) as Record<string, unknown>
    const raw =
      (typeof json.message === 'string' ? json.message : '') ||
      (typeof json.Message === 'string' ? json.Message : '') ||
      (typeof (json.error as { message?: string } | undefined)?.message === 'string'
        ? (json.error as { message: string }).message
        : '')
    if (raw) return simplifyCloudinaryError(raw)
  } catch {
    // plain text
  }

  return simplifyCloudinaryError(text)
}

async function getUploadConfig(): Promise<UploadConfigResponse> {
  if (uploadConfigCache) return uploadConfigCache

  const response = await fetch(`${API_URL}/api/upload/config`)
  if (!response.ok) {
    throw new ApiError('Could not load upload configuration from API', response.status)
  }

  uploadConfigCache = (await response.json()) as UploadConfigResponse
  return uploadConfigCache
}

function buildPublicId(file: File, resourceType: 'image' | 'raw'): string {
  const id = crypto.randomUUID().replace(/-/g, '')
  if (resourceType !== 'raw') return id

  const ext = file.name.match(/\.[^.]+$/i)?.[0]?.toLowerCase() ?? ''
  return ext ? `${id}${ext}` : id
}

async function directCloudinaryUpload(
  file: File,
  resourceType: 'image' | 'raw',
  folder: string,
  preset: string,
): Promise<UploadResult> {
  const config = await getUploadConfig()
  const cloudName = config.cloudName?.trim()
  if (!cloudName) {
    throw new ApiError('Cloudinary cloud name is not configured on the API.', 500)
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', preset)
  formData.append('folder', folder)
  formData.append('public_id', buildPublicId(file, resourceType))

  const endpoint = resourceType === 'raw' ? 'raw' : 'image'
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`,
    { method: 'POST', body: formData },
  )

  const text = await response.text()
  let data: CloudinaryDirectResponse
  try {
    data = JSON.parse(text) as CloudinaryDirectResponse
  } catch {
    throw new ApiError(parseUploadError(text, response.status), response.status)
  }

  if (!response.ok || data.error?.message) {
    throw new ApiError(
      simplifyCloudinaryError(data.error?.message ?? parseUploadError(text, response.status)),
      response.status,
    )
  }

  const url = pickString(data.secure_url, data.url)
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new ApiError('Cloudinary did not return a valid file URL.', 500)
  }

  return {
    url,
    viewUrl: url,
    downloadUrl: url,
    publicId: data.public_id,
    cloudinaryFolder: folder,
    resourceType: data.resource_type ?? resourceType,
  }
}

async function postUpload(path: string, file: File): Promise<UploadResult> {
  const token = getToken()
  if (!token) {
    throw new ApiError('You must be signed in to upload files.', 401)
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const text = await response.text()

  if (!response.ok) {
    throw new ApiError(parseUploadError(text, response.status), response.status)
  }

  let data: UploadResponse
  try {
    data = JSON.parse(text) as UploadResponse
  } catch {
    throw new ApiError('Upload succeeded but the server returned an invalid response.', 500)
  }

  const url = pickString(data.url, data.Url)
  const secureUrl = pickString(data.secureUrl, data.SecureUrl)
  const viewUrl = pickString(
    data.viewUrl,
    data.ViewUrl,
    data.secureUrl,
    data.SecureUrl,
    data.url,
    data.Url,
  )
  const downloadUrl = pickString(
    data.downloadUrl,
    data.DownloadUrl,
    data.viewUrl,
    data.ViewUrl,
    secureUrl,
    url,
  )

  if (!url || !/^https?:\/\//i.test(url)) {
    throw new ApiError('No valid Cloudinary URL returned from server', 500)
  }

  return {
    url,
    viewUrl: /^https?:\/\//i.test(viewUrl) ? viewUrl : url,
    downloadUrl: /^https?:\/\//i.test(downloadUrl) ? downloadUrl : viewUrl,
    publicId: data.publicId,
    cloudinaryFolder: data.cloudinaryFolder,
    resourceType: data.resourceType,
  }
}

async function uploadWithDirectFallback(
  file: File,
  serverPath: string,
  resourceType: 'image' | 'raw',
  folderKey: 'cvs' | 'jobs' | 'companies' | 'profiles',
  presetKey: 'imageUploadPreset' | 'rawUploadPreset',
): Promise<UploadResult> {
  try {
    const config = await getUploadConfig()
    const preset = config[presetKey]?.trim()
    const folder = config.folders?.[folderKey]?.trim()

    if (config.directUploadEnabled && preset && folder) {
      return await directCloudinaryUpload(file, resourceType, folder, preset)
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err
    // fall through to server upload
  }

  return postUpload(serverPath, file)
}

export function uploadCv(file: File) {
  return uploadWithDirectFallback(file, '/api/upload/cv', 'raw', 'cvs', 'rawUploadPreset')
}

export function uploadJobImage(file: File) {
  return uploadWithDirectFallback(file, '/api/upload/job-image', 'image', 'jobs', 'imageUploadPreset')
}

export function uploadCompanyLogo(file: File) {
  return uploadWithDirectFallback(
    file,
    '/api/upload/company-logo',
    'image',
    'companies',
    'imageUploadPreset',
  )
}

export function uploadProfileImage(file: File) {
  return uploadWithDirectFallback(
    file,
    '/api/upload/profile-image',
    'image',
    'profiles',
    'imageUploadPreset',
  )
}

export interface CoverImageUploadResult {
  url: string
  viewUrl: string
}

export async function uploadCoverImage(file: File): Promise<CoverImageUploadResult> {
  const result = await uploadJobImage(file)
  return { url: result.url, viewUrl: result.viewUrl }
}

export async function fetchUploadImagePreviewBlob(storedUrl: string): Promise<string> {
  if (storedUrl.includes('res.cloudinary.com')) {
    return storedUrl
  }

  const token = getToken()
  if (!token) {
    throw new ApiError('You must be signed in to preview images.', 401)
  }

  const response = await fetch(
    `${API_URL}/api/upload/image?url=${encodeURIComponent(storedUrl)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!response.ok) {
    throw new ApiError('Could not load image preview', response.status)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

export async function uploadImage(file: File): Promise<string> {
  const result = await uploadCoverImage(file)
  return result.url
}
