import type { ApplicationListItem } from '../types/job'
import { normalizeApplicationStatus } from './applicationStatus'

type CvUrlSource =
  | ApplicationListItem
  | Record<string, unknown>
  | { cvFileUrl?: string; CVFileUrl?: string; cvDownloadUrl?: string; CVDownloadUrl?: string }

function isSignedCloudinaryUrl(url: string): boolean {
  return url.includes('/s--') || url.includes('signature=')
}

/** Fix broken unsigned Cloudinary URLs only (never alter signed URLs). */
export function normalizeFileUrl(url: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (isSignedCloudinaryUrl(trimmed)) return trimmed

  let fixed = trimmed

  if (fixed.includes('.pdf.jpg')) {
    fixed = fixed.replace(/\.pdf\.jpg/gi, '.pdf')
  } else if ((fixed.includes('pdf') || fixed.includes('/raw/')) && /\.jpg(\?|$)/i.test(fixed)) {
    fixed = fixed.replace(/\.jpg(\?|$)/i, '$1')
  }

  fixed = fixed.replace('/fl_attachment/', '/')

  return fixed
}

export function getCvFileUrl(app: CvUrlSource): string {
  const raw = app as Record<string, unknown>
  const url =
    ('cvFileUrl' in app && typeof app.cvFileUrl === 'string' ? app.cvFileUrl : '') ||
    raw.CVFileUrl ||
    raw.cvFileUrl
  return typeof url === 'string' ? url.trim() : ''
}

export function getCvDownloadUrlFromSource(app: CvUrlSource): string {
  const raw = app as Record<string, unknown>
  const fromApp =
    'cvDownloadUrl' in app && typeof app.cvDownloadUrl === 'string' ? app.cvDownloadUrl : ''
  const url = fromApp || raw.CVDownloadUrl || raw.cvDownloadUrl
  return typeof url === 'string' ? url.trim() : ''
}

/** Open/view CV in browser */
export function getCvViewUrl(app: CvUrlSource): string {
  const url = getCvFileUrl(app)
  return url ? normalizeFileUrl(url) : ''
}

/** Download CV (signed URL from API when available) */
export function getCvDownloadUrl(app: CvUrlSource): string {
  const download = getCvDownloadUrlFromSource(app)
  if (download) return download
  return getCvViewUrl(app)
}

export function normalizeApplication(raw: Record<string, unknown>): ApplicationListItem {
  const cv = String(raw.cvFileUrl ?? raw.CVFileUrl ?? '').trim()
  const cvDownload = String(raw.cvDownloadUrl ?? raw.CVDownloadUrl ?? '').trim()
  return {
    applicationId: (raw.applicationId ?? raw.ApplicationId) as string | undefined,
    jobId: String(raw.jobId ?? raw.JobId ?? ''),
    jobTitle: String(raw.jobTitle ?? raw.JobTitle ?? ''),
    company: String(raw.company ?? raw.Company ?? ''),
    location: String(raw.location ?? raw.Location ?? ''),
    applicantName: String(raw.applicantName ?? raw.ApplicantName ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    yearsOfExperience: Number(raw.yearsOfExperience ?? raw.YearsOfExperience ?? 0),
    skills: String(raw.skills ?? raw.Skills ?? ''),
    educationLevel: String(raw.educationLevel ?? raw.EducationLevel ?? ''),
    cvFileUrl: cv,
    cvFileUrlStored: String(
      raw.cvFileUrlStored ?? raw.CVFileUrlStored ?? raw.cvFileUrlOriginal ?? '',
    ).trim() || undefined,
    cvDownloadUrl: cvDownload || undefined,
    message: String(raw.message ?? raw.Message ?? ''),
    status: normalizeApplicationStatus(raw.status ?? raw.Status),
    appliedAt: String(raw.appliedAt ?? raw.AppliedAt ?? ''),
  }
}

export function normalizeApplications(list: unknown[]): ApplicationListItem[] {
  return list.map((item) => normalizeApplication(item as Record<string, unknown>))
}
