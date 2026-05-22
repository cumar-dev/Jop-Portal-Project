import type { ApplicationStatus } from '../lib/applicationStatus'

export type { ApplicationStatus }

export interface Job {
  id?: string
  title: string
  description: string
  experience: string
  company: string
  location: string
  imageUrl?: string
  /** Unsigned Cloudinary URL stored in MongoDB (use when saving edits). */
  imageUrlOriginal?: string
  hasCoverImage?: boolean
  employerId?: string
}

export interface JobFormData {
  title: string
  description: string
  experience: string
  company: string
  location: string
  imageUrl: string
}

export interface CreateJobResponse {
  message: string
  job: Job
}

export interface ApplicationListItem {
  applicationId?: string
  jobId: string
  jobTitle: string
  company: string
  location: string
  applicantName: string
  email: string
  yearsOfExperience: number
  skills: string
  educationLevel: string
  cvFileUrl: string
  cvFileUrlStored?: string
  cvDownloadUrl?: string
  message: string
  status: ApplicationStatus
  appliedAt: string
}

export interface ApplyJobPayload {
  jobId: string
  yearsOfExperience: number
  skills: string
  educationLevel: string
  cvFileUrl: string
  message: string
}

export interface JobApplicationDetail {
  id?: string
  jobId: string
  userId: string
  applicantName: string
  email: string
  yearsOfExperience: number
  skills: string
  educationLevel: string
  cvFileUrl: string
  cvDownloadUrl?: string
  message: string
  status: ApplicationStatus
  appliedAt: string
}
