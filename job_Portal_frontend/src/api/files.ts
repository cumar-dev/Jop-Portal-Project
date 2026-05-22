import { getToken } from '../lib/authStorage'
import { ApiError } from './client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5046'

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) throw new ApiError('You must be signed in.', 401)
  return { Authorization: `Bearer ${token}` }
}

export function getCvStreamPath(applicationId: string, download = false): string {
  const q = download ? '?download=true' : ''
  return `${API_URL}/api/upload/cv/${applicationId}${q}`
}

function parseApiError(text: string, status: number): string {
  if (!text) return status === 401 ? 'Session expired. Please sign in again.' : 'Could not load CV'
  try {
    const json = JSON.parse(text) as { message?: string; Message?: string }
    return json.message ?? json.Message ?? text
  } catch {
    return text
  }
}

async function fetchCvBlob(applicationId: string, download = false): Promise<Blob> {
  const response = await fetch(getCvStreamPath(applicationId, download), {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new ApiError(parseApiError(text, response.status), response.status)
  }

  const blob = await response.blob()
  if (!blob.size) throw new ApiError('CV file is empty.', 502)
  return blob
}

/** View CV in browser (PDF via API proxy — avoids broken Cloudinary direct links). */
export async function openCvInBrowser(applicationId: string): Promise<void> {
  const blob = await fetchCvBlob(applicationId, false)
  const pdfBlob =
    blob.type === 'application/pdf'
      ? blob
      : new Blob([await blob.arrayBuffer()], { type: 'application/pdf' })

  const objectUrl = URL.createObjectURL(pdfBlob)
  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000)
}

/** Download CV file from Cloudinary through the API. */
export async function downloadCvFile(applicationId: string, fileName = 'cv.pdf'): Promise<void> {
  const blob = await fetchCvBlob(applicationId, true)
  const safeName =
    fileName.endsWith('.pdf') || fileName.endsWith('.docx') ? fileName : `${fileName}.pdf`

  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = safeName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
