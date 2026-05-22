import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Bookmark, Briefcase, Clock, FileText, Search } from 'lucide-react'
import { RecentApplicationsTable } from '../../components/shared/RecentApplicationsTable'
import { countByStatus } from '../../lib/applicationStatus'
import { getMyApplications } from '../../api/applications'
import { getAllJobs } from '../../api/jobs'
import { getUnreadNotificationCount } from '../../api/notifications'
import { getSavedJobIds } from '../../api/savedJobs'
import { ApiError } from '../../api/client'
import { ApplicantLayout } from '../../components/applicant/ApplicantLayout'
import { StatCard } from '../../components/employer/StatCard'
import { Alert } from '../../components/ui/Alert'
import { getStoredUser } from '../../lib/authStorage'

export function ApplicantOverviewPage() {
  const user = getStoredUser()
  const [jobCount, setJobCount] = useState(0)
  const [applicationCount, setApplicationCount] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [applications, setApplications] = useState<Awaited<ReturnType<typeof getMyApplications>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [jobs, apps, savedIds, unread] = await Promise.all([
          getAllJobs(),
          getMyApplications(10),
          getSavedJobIds(),
          getUnreadNotificationCount(),
        ])
        setJobCount(jobs.length)
        setApplications(apps)
        setApplicationCount(apps.length)
        setSavedCount(savedIds.length)
        setUnreadNotifications(unread)
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
  const recentApps = applications.slice(0, 5)

  return (
    <ApplicantLayout
      title={`Hello, ${firstName}`}
      subtitle="Discover roles and track your applications in one place."
      action={
        <Link
          to="/applicant/dashboard/jobs"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <Search className="h-4 w-4" />
          Browse jobs
        </Link>
      }
    >
      {error && <Alert variant="error" message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Open positions"
          value={loading ? '—' : jobCount}
          icon={Briefcase}
          trend="Jobs you can apply to"
          accent="emerald"
        />
        <StatCard
          label="Saved jobs"
          value={loading ? '—' : savedCount}
          icon={Bookmark}
          trend="Bookmarked for later"
          accent="amber"
        />
        <StatCard
          label="Notifications"
          value={loading ? '—' : unreadNotifications}
          icon={Bell}
          trend="Unread updates"
          accent="blue"
        />
        <StatCard
          label="Your applications"
          value={loading ? '—' : applicationCount}
          icon={FileText}
          trend="Submitted by you"
          accent="blue"
        />
        <StatCard
          label="Pending review"
          value={loading ? '—' : statusCounts.Pending}
          icon={Clock}
          trend={
            applicationCount > 0
              ? `${statusCounts.Accepted} accepted · ${statusCounts.Rejected} rejected`
              : 'Track status after you apply'
          }
          accent="violet"
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent applications</h2>
          <Link
            to="/applicant/dashboard/applications"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-muted shadow-sm">
            Loading...
          </p>
        ) : recentApps.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-muted shadow-sm">
            You haven&apos;t applied yet.{' '}
            <Link to="/applicant/dashboard/jobs" className="font-medium text-emerald-600">
              Browse jobs
            </Link>{' '}
            to get started.
          </p>
        ) : (
          <RecentApplicationsTable
            applications={applications}
            variant="applicant"
            footer={
              <Link
                to="/applicant/dashboard/applications"
                className="font-medium text-emerald-600 hover:text-emerald-700"
              >
                Open full application table →
              </Link>
            }
          />
        )}
      </section>
    </ApplicantLayout>
  )
}
