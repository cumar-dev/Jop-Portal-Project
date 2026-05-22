import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Clock, FileText, Plus, Users } from 'lucide-react'
import { RecentApplicationsTable } from '../../components/shared/RecentApplicationsTable'
import { countByStatus } from '../../lib/applicationStatus'
import { getRecentApplications } from '../../api/applications'
import { getMyJobs } from '../../api/jobs'
import { ApiError } from '../../api/client'
import { EmployerLayout } from '../../components/employer/EmployerLayout'
import { StatCard } from '../../components/employer/StatCard'
import { Alert } from '../../components/ui/Alert'
import type { ApplicationListItem, Job } from '../../types/job'
import { getStoredUser } from '../../lib/authStorage'

export function EmployerOverviewPage() {
  const user = getStoredUser()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [jobsData, appsData] = await Promise.all([
          getMyJobs(),
          getRecentApplications(100),
        ])
        setJobs(jobsData)
        setApplications(appsData)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const firstName = user?.fullName.split(' ')[0] ?? 'there'
  const statusCounts = countByStatus(applications)

  return (
    <EmployerLayout
      title={`Hello, ${firstName}`}
      subtitle="Here's what's happening with your job postings today."
      action={
        <Link
          to="/employer/dashboard/jobs"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Post a job</span>
          <span className="sm:hidden">New job</span>
        </Link>
      }
    >
      {error && <Alert variant="error" message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active job posts"
          value={loading ? '—' : jobs.length}
          icon={Briefcase}
          trend="Jobs you've published"
          accent="blue"
        />
        <StatCard
          label="Total applications"
          value={loading ? '—' : applications.length}
          icon={Users}
          trend="Across your listings"
          accent="emerald"
        />
        <StatCard
          label="Pending review"
          value={loading ? '—' : statusCounts.Pending}
          icon={Clock}
          trend={
            applications.length > 0
              ? `${statusCounts.Reviewed} reviewed · ${statusCounts.Accepted} accepted`
              : 'No applications yet'
          }
          accent="violet"
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent applications</h2>
          <Link
            to="/employer/dashboard/applications"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-muted shadow-sm">
            Loading...
          </p>
        ) : applications.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-muted shadow-sm">
            No applications yet. Post a job to start receiving candidates.
          </p>
        ) : (
          <RecentApplicationsTable
            applications={applications}
            variant="employer"
            footer={
              <Link
                to="/employer/dashboard/applications"
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                Open full application table →
              </Link>
            }
          />
        )}
      </section>
    </EmployerLayout>
  )
}
