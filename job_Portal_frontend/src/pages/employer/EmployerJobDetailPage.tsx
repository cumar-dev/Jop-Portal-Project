import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Users } from 'lucide-react'
import { deleteJob, getJobById } from '../../api/jobs'
import { ApiError } from '../../api/client'
import { EmployerLayout } from '../../components/employer/EmployerLayout'
import { ApplicantsModal } from '../../components/employer/ApplicantsModal'
import { JobFormModal } from '../../components/employer/JobFormModal'
import { JobDetailContent } from '../../components/jobs/JobDetailContent'
import { Alert } from '../../components/ui/Alert'
import { getStoredUser } from '../../lib/authStorage'
import type { Job } from '../../types/job'

export function EmployerJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const user = getStoredUser()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [applicantsOpen, setApplicantsOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getJobById(jobId)
      if (data.employerId && user?.id && data.employerId !== user.id) {
        setError('This job belongs to another employer account.')
        setJob(null)
        return
      }
      setJob(data)
    } catch (err) {
      setJob(null)
      setError(err instanceof ApiError ? err.message : 'Failed to load job details')
    } finally {
      setLoading(false)
    }
  }, [jobId, user?.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete() {
    if (!job?.id) return
    const confirmed = window.confirm(`Delete "${job.title}"? This cannot be undone.`)
    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteJob(job.id)
      navigate('/employer/dashboard/jobs')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete job')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <EmployerLayout
      title="Job details"
      subtitle={job ? job.title : 'View and manage your listing'}
      action={
        <Link
          to="/employer/dashboard/jobs"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>
      }
    >
      {error && <Alert variant="error" message={error} />}
      {loading && (
        <p className="text-center text-sm text-muted">Loading job details...</p>
      )}
      {!loading && job && (
        <>
          <JobDetailContent
            job={job}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setApplicantsOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
                >
                  <Users className="h-4 w-4 text-brand-600" />
                  View applicants
                </button>
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit job
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete job'}
                </button>
              </>
            }
          />
          <JobFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            job={job}
            onSaved={load}
          />
          <ApplicantsModal
            open={applicantsOpen}
            onClose={() => setApplicantsOpen(false)}
            jobId={job.id ?? null}
            jobTitle={job.title}
          />
        </>
      )}
    </EmployerLayout>
  )
}
