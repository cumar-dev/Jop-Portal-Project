import type { ApplicationStatus } from '../lib/applicationStatus'

export type NotificationType = 'application_update' | 'new_job_match'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  jobId?: string
  applicationId?: string
  jobTitle?: string
  company?: string
  status?: ApplicationStatus
  isRead: boolean
  createdAt: string
}
