import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, MapPin, Search, Send } from 'lucide-react'
import { getMyApplications } from '../../api/applications'
import { getSavedJobs, removeSavedJob, type SavedJobEntry } from '../../api/savedJobs'
import { ApiError } from '../../api/client'
import { ApplicantLayout } from '../../components/applicant/ApplicantLayout'
import { ApplyJobModal } from '../../components/applicant/ApplyJobModal'
import { EmptyState } from '../../components/employer/EmptyState'
import { JobCardImage } from '../../components/jobs/JobCardImage'
import { Alert } from '../../components/ui/Alert'
import type { Job } from '../../types/job'
import { formatDateTime } from '../../lib/format'

export function ApplicantSavedJobsPage() {
  const [entries, setEntries] = useState<SavedJobEntry[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [saved, myApps] = await Promise.all([getSavedJobs(), getMyApplications(100)])
      setEntries(saved)
      setAppliedJobIds(new Set(myApps.map((a) => a.jobId)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load saved jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      ({ job }) =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q),
    )
  }, [entries, search])

  async function handleRemove(jobId: string) {
    setRemovingId(jobId)
    setError(null)
    try {
      await removeSavedJob(jobId)
      setEntries((prev) => prev.filter((e) => e.job.id !== jobId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove saved job')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <ApplicantLayout
      title="Saved jobs"
      subtitle="Bookmark roles you want to revisit and apply when you're ready."
    >
      {error && <Alert variant="error" message={error} />}

      <div className="relative mb-6 max-w-md">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Search saved jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
        />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted">Loading saved jobs...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={search ? 'No saved jobs match your search' : 'No saved jobs yet'}
          description={
            search
              ? 'Try a different keyword or clear the search.'
              : 'Browse jobs and tap the bookmark icon to save roles for later.'
          }
          action={
            !search ? (
              <Link
                to="/applicant/dashboard/jobs"
                className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Browse jobs
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ job, savedAt }) => {
            const applied = job.id ? appliedJobIds.has(job.id) : false
            return (
              <article
                key={job.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="relative">
                  <JobCardImage job={job} className="h-36 w-full" />
                  <button
                    type="button"
                    disabled={removingId === job.id}
                    onClick={() => job.id && handleRemove(job.id)}
                    title="Remove from saved"
                    aria-label="Remove from saved jobs"
                    className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:opacity-60"
                  >
                    <Bookmark className="h-3.5 w-3.5 fill-current" />
                    {removingId === job.id ? 'Removing...' : 'Saved'}
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-semibold text-ink">{job.title}</h3>
                  <p className="mt-1 text-sm font-medium text-emerald-700">{job.company}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Saved {savedAt ? formatDateTime(savedAt) : 'recently'}
                  </p>
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
