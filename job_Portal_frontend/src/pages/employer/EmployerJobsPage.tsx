import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Eye, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { deleteJob, getMyJobs } from '../../api/jobs'
import { ApiError } from '../../api/client'
import { EmployerLayout } from '../../components/employer/EmployerLayout'
import { EmptyState } from '../../components/employer/EmptyState'
import { JobFormModal } from '../../components/employer/JobFormModal'
import { ApplicantsModal } from '../../components/employer/ApplicantsModal'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { JobCardImage } from '../../components/jobs/JobCardImage'
import type { Job } from '../../types/job'

export function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [applicantsJob, setApplicantsJob] = useState<Job | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyJobs()
      setJobs(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  function openCreate() {
    setEditingJob(null)
    setFormOpen(true)
  }

  function openEdit(job: Job) {
    setEditingJob(job)
    setFormOpen(true)
  }

  async function handleDelete(job: Job) {
    if (!job.id) return
    const confirmed = window.confirm(
      `Delete "${job.title}"? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingId(job.id)
    try {
      await deleteJob(job.id)
      await loadJobs()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete job')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <EmployerLayout
      title="My jobs"
      subtitle="Create, edit, and manage your job listings."
      action={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Post job
        </button>
      }
    >
      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <p className="text-center text-sm text-muted">Loading your jobs...</p>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs posted yet"
          description="Create your first listing to start attracting qualified candidates."
          action={
            <Button onClick={openCreate} className="sm:w-auto sm:min-w-[160px]">
              Post your first job
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <JobCardImage job={job} className="h-36 w-full" />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold text-ink">{job.title}</h3>
                <p className="mt-1 text-sm font-medium text-brand-600">{job.company}</p>
                <p className="mt-2 text-xs text-muted">
                  {job.location} · {job.experience} experience
                </p>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted">{job.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {job.id && (
                    <Link
                      to={`/employer/dashboard/jobs/${job.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setApplicantsJob(job)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
                  >
                    <Users className="h-4 w-4 text-brand-600" />
                    Applicants
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(job)}
                    className="col-span-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(job)}
                    disabled={deletingId === job.id}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === job.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <JobFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        job={editingJob}
        onSaved={loadJobs}
      />

      <ApplicantsModal
        open={Boolean(applicantsJob)}
        onClose={() => setApplicantsJob(null)}
        jobId={applicantsJob?.id ?? null}
        jobTitle={applicantsJob?.title ?? ''}
      />
    </EmployerLayout>
  )
}
