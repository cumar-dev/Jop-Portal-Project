import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Pencil, Search, Trash2 } from 'lucide-react'
import { deleteApplication, getMyApplications } from '../../api/applications'
import { ApiError } from '../../api/client'
import { ApplicantLayout } from '../../components/applicant/ApplicantLayout'
import { EditApplicationModal } from '../../components/applicant/EditApplicationModal'
import { EmptyState } from '../../components/employer/EmptyState'
import { ApplicationStatusBadge } from '../../components/shared/ApplicationStatusBadge'
import { ApplicationStatusTabs } from '../../components/shared/ApplicationStatusTabs'
import { ApplicationsTableShell } from '../../components/shared/ApplicationsTableShell'
import { applicationsTable } from '../../components/shared/applicationsTableStyles'
import { Alert } from '../../components/ui/Alert'
import { CvActionButtons } from '../../components/shared/CvActionButtons'
import type { ApplicationListItem } from '../../types/job'
import type { ApplicationStatus } from '../../lib/applicationStatus'
import { formatDateTime } from '../../lib/format'

type StatusFilter = 'All' | ApplicationStatus

export function ApplicantApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingApp, setEditingApp] = useState<ApplicationListItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyApplications(50)
      setApplications(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return applications
    return applications.filter((app) => app.status === statusFilter)
  }, [applications, statusFilter])

  async function handleWithdraw(app: ApplicationListItem) {
    if (!app.applicationId) return
    const ok = window.confirm(`Withdraw your application for "${app.jobTitle}"?`)
    if (!ok) return

    setDeletingId(app.applicationId)
    try {
      await deleteApplication(app.applicationId)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not withdraw application')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ApplicantLayout
      title="Job applications"
      subtitle="Track submissions and hiring decisions across your pipeline."
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

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Loading applications...</p>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Your submissions will appear in a structured table with live status updates."
          action={
            <Link
              to="/applicant/dashboard/jobs"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Browse jobs
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={`No ${statusFilter.toLowerCase()} applications`}
          description="Try another status filter or apply to more roles."
        />
      ) : (
        <ApplicationsTableShell
          title="Application pipeline"
          meta={`${filtered.length} of ${applications.length} shown`}
          toolbar={
            <ApplicationStatusTabs
              items={applications}
              active={statusFilter}
              onChange={setStatusFilter}
            />
          }
          footer={`Showing ${filtered.length} application${filtered.length === 1 ? '' : 's'}`}
        >
          <div className={applicationsTable.scroll}>
            <table className={applicationsTable.table}>
              <thead className={applicationsTable.thead}>
                <tr>
                  <th className={applicationsTable.th}>Position</th>
                  <th className={applicationsTable.th}>Status</th>
                  <th className={applicationsTable.th}>Qualifications</th>
                  <th className={applicationsTable.th}>Submitted</th>
                  <th className={applicationsTable.th}>Resume</th>
                  <th className={`${applicationsTable.th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className={applicationsTable.tbody}>
                {filtered.map((app) => (
                  <tr
                    key={app.applicationId ?? `${app.jobId}-${app.appliedAt}`}
                    className={applicationsTable.row}
                  >
                    <td className={applicationsTable.td}>
                      <p className={applicationsTable.primary}>{app.jobTitle}</p>
                      <p className={applicationsTable.secondary}>
                        {app.company} · {app.location}
                      </p>
                    </td>
                    <td className={applicationsTable.td}>
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className={applicationsTable.td}>
                      <p className={applicationsTable.muted}>
                        {app.yearsOfExperience} years experience
                      </p>
                      <p className={applicationsTable.secondary}>
                        {app.educationLevel || 'Education not specified'}
                      </p>
                    </td>
                    <td className={`${applicationsTable.td} whitespace-nowrap ${applicationsTable.muted}`}>
                      {formatDateTime(app.appliedAt)}
                    </td>
                    <td className={applicationsTable.td}>
                      {app.applicationId ? (
                        <CvActionButtons applicationId={app.applicationId} compact />
                      ) : (
                        <span className={applicationsTable.muted}>—</span>
                      )}
                    </td>
                    <td className={`${applicationsTable.td} text-right`}>
                      {app.applicationId && (
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingApp(app)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWithdraw(app)}
                            disabled={deletingId === app.applicationId}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === app.applicationId ? 'Withdrawing…' : 'Withdraw'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ApplicationsTableShell>
      )}
      <EditApplicationModal
        open={Boolean(editingApp)}
        onClose={() => setEditingApp(null)}
        application={editingApp}
        onSaved={load}
      />
    </ApplicantLayout>
  )
}
