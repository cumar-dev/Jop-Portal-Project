import { withCloudinaryCoverTransform } from './job'

/** Remove Cloudinary signed delivery segment so transforms work. */
export function stripCloudinarySignedSegment(url: string): string {
  return url.replace(/\/s--[^/]+--\//g, '/')
}

/** Browser-ready profile photo URL (square crop). Prefers canonical stored URL. */
export function getProfileImageDisplayUrl(
  viewUrl?: string,
  storedUrl?: string,
): string {
  const candidates = getProfileImageCandidates(viewUrl, storedUrl)
  return candidates[0] ?? ''
}

/** Ordered URLs to try when loading a profile photo. */
export function getProfileImageCandidates(
  viewUrl?: string,
  storedUrl?: string,
): string[] {
  const seen = new Set<string>()
  const list: string[] = []

  function add(url: string) {
    const trimmed = stripCloudinarySignedSegment(url.trim())
    if (!trimmed.startsWith('http') || seen.has(trimmed)) return
    seen.add(trimmed)
    list.push(trimmed)
  }

  const stored = storedUrl?.trim() ?? ''
  const view = viewUrl?.trim() ?? ''

  if (stored.includes('res.cloudinary.com')) {
    add(withCloudinaryCoverTransform(stored, 400, 400))
    add(stored)
  }

  if (view.includes('res.cloudinary.com')) {
    add(withCloudinaryCoverTransform(view, 400, 400))
    add(view)
  } else if (view.startsWith('http')) {
    add(view)
  }

  return list
}
