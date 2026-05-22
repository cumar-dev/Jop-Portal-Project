import type { Job } from '../types/job'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5046'

/** API / MongoDB may return imageUrl or ImageUrl */
export function getJobImageUrl(job: Job | Record<string, unknown>): string {
  const raw = job as Record<string, unknown>
  const candidates = [
    raw.imageUrl,
    raw.ImageUrl,
    (job as Job).imageUrl,
  ]
  for (const value of candidates) {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }
  }
  return ''
}

/** Canonical URL for saving to the API (not signed). */
export function getJobImageUrlOriginal(job: Job | Record<string, unknown>): string {
  const raw = job as Record<string, unknown>
  const candidates = [
    raw.imageUrlOriginal,
    raw.ImageUrlOriginal,
    (job as Job).imageUrlOriginal,
  ]
  for (const value of candidates) {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }
  }
  const signed = getJobImageUrl(job)
  if (signed.includes('/s--')) {
    return signed.replace(/\/s--[^/]+--\//, '/')
  }
  return signed
}

export function jobHasCover(job: Job | Record<string, unknown>): boolean {
  const raw = job as Record<string, unknown>
  if (raw.hasCoverImage === true || raw.HasCoverImage === true) return true
  return Boolean(getJobImageUrlOriginal(job) || getJobImageUrl(job))
}

/** Cloudinary crop + quality for sharp cover cards. */
export function withCloudinaryCoverTransform(
  url: string,
  width = 960,
  height = 400,
): string {
  const trimmed = url.trim().replace(/\/s--[^/]+--\//g, '/')
  if (!trimmed.includes('res.cloudinary.com') || !trimmed.includes('/image/upload/')) {
    return trimmed
  }

  const marker = '/image/upload/'
  const markerIndex = trimmed.indexOf(marker)
  const head = trimmed.slice(0, markerIndex + marker.length)
  let tail = trimmed.slice(markerIndex + marker.length).replace(/^\/+/, '')

  if (tail.includes('c_fill') || tail.startsWith('w_') || tail.includes(',q_auto')) {
    return trimmed
  }

  return `${head}c_fill,w_${width},h_${height},q_auto,f_auto/${tail}`
}

/** Ordered URLs to try when loading a cover image. */
export function getJobCoverCandidates(job: Job): string[] {
  const original = getJobImageUrlOriginal(job)
  const fromApi = getJobImageUrl(job)
  const seen = new Set<string>()
  const list: string[] = []

  function add(url: string) {
    const trimmed = url.trim()
    if (!trimmed.startsWith('http') || seen.has(trimmed)) return
    seen.add(trimmed)
    list.push(trimmed)
  }

  if (original.includes('res.cloudinary.com')) {
    add(withCloudinaryCoverTransform(original))
    add(original)
  }

  if (fromApi.includes('res.cloudinary.com')) {
    add(withCloudinaryCoverTransform(fromApi))
    add(fromApi)
  } else if (fromApi) {
    add(fromApi)
  }

  if (job.id && jobHasCover(job)) {
    add(`${API_URL}/api/jobs/${job.id}/cover`)
  }

  return list
}

/** Primary src for job cover <img> tags. */
export function getJobCoverSrc(job: Job): string {
  const candidates = getJobCoverCandidates(job)
  return candidates[0] ?? ''
}

export function normalizeJob(raw: Record<string, unknown>): Job {
  const imageUrlOriginal = getJobImageUrlOriginal(raw)
  const imageUrl = getJobImageUrl(raw)

  return {
    id: (raw.id ?? raw.Id) as string | undefined,
    title: String(raw.title ?? raw.Title ?? ''),
    description: String(raw.description ?? raw.Description ?? ''),
    experience: String(raw.experience ?? raw.Experience ?? ''),
    company: String(raw.company ?? raw.Company ?? ''),
    location: String(raw.location ?? raw.Location ?? ''),
    imageUrl: imageUrl || (imageUrlOriginal ? withCloudinaryCoverTransform(imageUrlOriginal) : ''),
    imageUrlOriginal,
    hasCoverImage:
      Boolean(raw.hasCoverImage ?? raw.HasCoverImage) ||
      Boolean(imageUrlOriginal || imageUrl),
    employerId: (raw.employerId ?? raw.EmployerId) as string | undefined,
  }
}

export function normalizeJobs(list: unknown[]): Job[] {
  return list.map((item) => normalizeJob(item as Record<string, unknown>))
}
