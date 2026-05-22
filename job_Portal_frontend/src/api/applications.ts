import type { ApplyJobPayload, JobApplicationDetail } from '../types/job'
import type { ApplicationStatus } from '../lib/applicationStatus'
import { normalizeApplicationStatus } from '../lib/applicationStatus'
import { getCvDownloadUrl, getCvViewUrl, normalizeApplications } from '../lib/application'
import { apiDelete, apiGet, apiPost, apiPut } from './client'

export async function getRecentApplications(limit = 50) {
  const data = await apiGet<unknown[]>(`/api/applications/recent?limit=${limit}`)
  return normalizeApplications(data)
}

export async function getMyApplications(limit = 50) {
  const data = await apiGet<unknown[]>(`/api/applications/my?limit=${limit}`)
  return normalizeApplications(data)
}

export async function getApplicantsForJob(jobId: string) {
  const data = await apiGet<Record<string, unknown>[]>(`/api/applications/job/${jobId}`)
  return data.map((raw) => {
    const item = {
      id: (raw.applicationId ?? raw.id ?? raw.Id) as string | undefined,
      jobId: String(raw.jobId ?? raw.JobId ?? ''),
      userId: String(raw.userId ?? raw.UserId ?? ''),
      applicantName: String(raw.applicantName ?? raw.ApplicantName ?? ''),
      email: String(raw.email ?? raw.Email ?? ''),
      yearsOfExperience: Number(raw.yearsOfExperience ?? raw.YearsOfExperience ?? 0),
      skills: String(raw.skills ?? raw.Skills ?? ''),
      educationLevel: String(raw.educationLevel ?? raw.EducationLevel ?? ''),
      cvFileUrl: String(raw.cvFileUrl ?? raw.CVFileUrl ?? ''),
      cvDownloadUrl: String(raw.cvDownloadUrl ?? raw.CVDownloadUrl ?? ''),
      message: String(raw.message ?? raw.Message ?? ''),
      status: normalizeApplicationStatus(raw.status ?? raw.Status),
      appliedAt: String(raw.appliedAt ?? raw.AppliedAt ?? ''),
    }
    return {
      ...item,
      cvFileUrl: getCvViewUrl(item),
      cvDownloadUrl: getCvDownloadUrl(item),
    }
  }) as JobApplicationDetail[]
}

export function applyForJob(payload: ApplyJobPayload) {
  return apiPost<{ message: string; applicationId: string }>(
    '/api/applications/apply',
    payload,
  )
}

export function deleteApplication(id: string) {
  return apiDelete<{ message: string }>(`/api/applications/delete/${id}`)
}

export function updateApplication(id: string, payload: ApplyJobPayload) {
  return apiPut<{ message: string }>(`/api/applications/update/${id}`, payload)
}

export function updateApplicationStatus(id: string, status: ApplicationStatus) {
  return apiPut<{ message: string; applicationId: string; status: ApplicationStatus }>(
    `/api/applications/${id}/status`,
    { status },
  )
}
