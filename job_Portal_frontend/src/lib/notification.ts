import { normalizeApplicationStatus } from './applicationStatus'
import type { AppNotification, NotificationType } from '../types/notification'

function normalizeType(value: unknown): NotificationType {
  const s = String(value ?? '').toLowerCase()
  if (s === 'new_job_match') return 'new_job_match'
  return 'application_update'
}

export function normalizeNotification(raw: Record<string, unknown>): AppNotification {
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    type: normalizeType(raw.type ?? raw.Type),
    title: String(raw.title ?? raw.Title ?? ''),
    message: String(raw.message ?? raw.Message ?? ''),
    jobId: raw.jobId ?? raw.JobId ? String(raw.jobId ?? raw.JobId) : undefined,
    applicationId:
      raw.applicationId ?? raw.ApplicationId
        ? String(raw.applicationId ?? raw.ApplicationId)
        : undefined,
    jobTitle: raw.jobTitle ?? raw.JobTitle ? String(raw.jobTitle ?? raw.JobTitle) : undefined,
    company: raw.company ?? raw.Company ? String(raw.company ?? raw.Company) : undefined,
    status:
      raw.status ?? raw.Status
        ? normalizeApplicationStatus(raw.status ?? raw.Status)
        : undefined,
    isRead: Boolean(raw.isRead ?? raw.IsRead),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
  }
}

export function normalizeNotifications(data: unknown[]): AppNotification[] {
  if (!Array.isArray(data)) return []
  return data.map((item) => normalizeNotification(item as Record<string, unknown>))
}

export function notificationLabel(type: NotificationType): string {
  return type === 'new_job_match' ? 'New job match' : 'Application update'
}
