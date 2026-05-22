import type { CreateJobResponse, JobFormData } from '../types/job'
import { normalizeJob, normalizeJobs } from '../lib/job'
import { apiDelete, apiGet, apiPost, apiPut } from './client'

export async function getAllJobs() {
  const data = await apiGet<unknown[]>('/api/jobs')
  return normalizeJobs(data)
}

export async function getJobById(id: string) {
  const data = await apiGet<Record<string, unknown>>(`/api/jobs/${id}`)
  return normalizeJob(data)
}

export async function getMyJobs() {
  const data = await apiGet<unknown[]>('/api/jobs/mine')
  return normalizeJobs(data)
}

export function createJob(data: JobFormData) {
  return apiPost<CreateJobResponse>('/api/jobs', data)
}

export function updateJob(id: string, data: JobFormData) {
  return apiPut<{ message: string }>(`/api/jobs/${id}`, data)
}

export function deleteJob(id: string) {
  return apiDelete<{ message: string }>(`/api/jobs/${id}`)
}
