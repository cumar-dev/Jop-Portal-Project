import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, Send } from 'lucide-react'
import { getMyApplications } from '../../api/applications'
import { getAllJobs } from '../../api/jobs'
import { getSavedJobIds } from '../../api/savedJobs'
import { ApiError } from '../../api/client'
import { ApplicantLayout } from '../../components/applicant/ApplicantLayout'
import { ApplyJobModal } from '../../components/applicant/ApplyJobModal'
import { EmptyState } from '../../components/employer/EmptyState'
import { Alert } from '../../components/ui/Alert'
import { JobCardImage } from '../../components/jobs/JobCardImage'
import { SaveJobButton } from '../../components/jobs/SaveJobButton'
import type { Job } from '../../types/job'

export function ApplicantJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [jobsData, myApps, savedIds] = await Promise.all([
        getAllJobs(),
        getMyApplications(100),
        getSavedJobIds(),
      ])
      setJobs(jobsData)
      setAppliedJobIds(new Set(myApps.map((a) => a.jobId)))
      setSavedJobIds(new Set(savedIds))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return jobs
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q),
    )
  }, [jobs, search])

  return (
    <ApplicantLayout
      title="Browse jobs"
      subtitle="Find roles that match your skills and apply in minutes."
    >
      {error && <Alert variant="error" message={error} />}

      <div className="relative mb-6 max-w-md">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Search by title, company, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
        />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted">Loading jobs...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={search ? 'No jobs match your search' : 'No jobs available'}
          description={
            search
              ? 'Try a different keyword or clear the search.'
              : 'Check back later for new openings from employers.'
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job) => {
            const applied = job.id ? appliedJobIds.has(job.id) : false
            return (
              <article
                key={job.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="relative">
                  <JobCardImage job={job} className="h-36 w-full" />
                  {job.id && (
                    <div className="absolute top-3 right-3">
                      <SaveJobButton
                        jobId={job.id}
                        saved={savedJobIds.has(job.id)}
                        onChange={(saved) => {
                          setSavedJobIds((prev) => {
                            const next = new Set(prev)
                            if (saved) next.add(job.id!)
                            else next.delete(job.id!)
                            return next
                          })
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-semibold text-ink">{job.title}</h3>
                  <p className="mt-1 text-sm font-medium text-emerald-700">{job.company}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </p>
                  <p className="mt-1 text-xs text-muted">{job.experience} experience</p>
                  <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted">{job.description}</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {job.id && (
                      <Link
                        to={`/applicant/dashboard/jobs/${job.id}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
                      >
                        View details
                      </Link>
                    )}
                    <button
                      type="button"
                      disabled={applied || !job.id}
                      onClick={() => setApplyJob(job)}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        applied
                          ? 'cursor-default bg-slate-100 text-muted'
                          : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700'
                      }`}
                    >
                      <Send className="h-4 w-4" />
                      {applied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <ApplyJobModal
        open={Boolean(applyJob)}
        onClose={() => setApplyJob(null)}
        job={applyJob}
        onApplied={load}
      />
    </ApplicantLayout>
  )
}
