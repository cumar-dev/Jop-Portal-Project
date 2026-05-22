import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { getMyApplications } from '../../api/applications'
import { getJobById } from '../../api/jobs'
import { getSavedJobIds } from '../../api/savedJobs'
import { ApiError } from '../../api/client'
import { ApplicantLayout } from '../../components/applicant/ApplicantLayout'
import { ApplyJobModal } from '../../components/applicant/ApplyJobModal'
import { JobDetailContent } from '../../components/jobs/JobDetailContent'
import { SaveJobButton } from '../../components/jobs/SaveJobButton'
import { Alert } from '../../components/ui/Alert'
import type { Job } from '../../types/job'

export function ApplicantJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)

  const load = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const [jobData, myApps, savedIds] = await Promise.all([
        getJobById(jobId),
        getMyApplications(100),
        getSavedJobIds(),
      ])
      setJob(jobData)
      setApplied(myApps.some((a) => a.jobId === jobId))
      setSaved(savedIds.includes(jobId))
    } catch (err) {
      setJob(null)
      setError(err instanceof ApiError ? err.message : 'Failed to load job details')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <ApplicantLayout
      title="Job details"
      subtitle={job ? `${job.company} · ${job.location}` : 'View full job information'}
      action={
        <Link
          to="/applicant/dashboard/jobs"
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
              <div className="flex flex-wrap items-center gap-3">
                {job.id && (
                  <SaveJobButton
                    jobId={job.id}
                    saved={saved}
                    variant="button"
                    onChange={setSaved}
                  />
                )}
                <button
                  type="button"
                  disabled={applied}
                  onClick={() => setApplyOpen(true)}
                  className={`inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                    applied
                      ? 'cursor-default bg-slate-100 text-muted'
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  {applied ? 'Already applied' : 'Apply now'}
                </button>
              </div>
            }
          />
          <ApplyJobModal
            open={applyOpen}
            onClose={() => setApplyOpen(false)}
            job={job}
            onApplied={() => {
              setApplied(true)
              setApplyOpen(false)
            }}
          />
        </>
      )}
    </ApplicantLayout>
  )
}
