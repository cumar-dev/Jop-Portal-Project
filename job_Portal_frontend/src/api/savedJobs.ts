import { normalizeJob } from '../lib/job'
import type { Job } from '../types/job'
import { apiDelete, apiGet, apiPost } from './client'

export interface SavedJobEntry {
  savedAt: string
  job: Job
}

export async function getSavedJobs(): Promise<SavedJobEntry[]> {
  const data = await apiGet<unknown[]>('/api/saved-jobs')
  if (!Array.isArray(data)) return []

  return data.map((item) => {
    const row = item as Record<string, unknown>
    return {
      savedAt: String(row.savedAt ?? row.SavedAt ?? ''),
      job: normalizeJob((row.job ?? row.Job) as Record<string, unknown>),
    }
  })
}

export async function getSavedJobIds(): Promise<string[]> {
  const data = await apiGet<string[]>('/api/saved-jobs/ids')
  return Array.isArray(data) ? data : []
}

export function saveJob(jobId: string) {
  return apiPost<{ message: string; jobId: string }>(`/api/saved-jobs/${jobId}`, {})
}

export function removeSavedJob(jobId: string) {
  return apiDelete<{ message: string; jobId: string }>(`/api/saved-jobs/${jobId}`)
}
