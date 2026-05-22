import { useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { getRecentApplications, updateApplicationStatus } from '../../api/applications'
import { ApiError } from '../../api/client'
import { EmployerLayout } from '../../components/employer/EmployerLayout'
import { EmptyState } from '../../components/employer/EmptyState'
import { ApplicationStatusSelect } from '../../components/shared/ApplicationStatusSelect'
import { ApplicationStatusTabs } from '../../components/shared/ApplicationStatusTabs'
import { ApplicationsTableShell } from '../../components/shared/ApplicationsTableShell'
import { applicationsTable } from '../../components/shared/applicationsTableStyles'
import { Alert } from '../../components/ui/Alert'
import { CvActionButtons } from '../../components/shared/CvActionButtons'
import type { ApplicationListItem } from '../../types/job'
import type { ApplicationStatus } from '../../lib/applicationStatus'
import { formatDateTime } from '../../lib/format'

type StatusFilter = 'All' | ApplicationStatus

export function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getRecentApplications(50)
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

  async function handleStatusChange(app: ApplicationListItem, status: ApplicationStatus) {
    if (!app.applicationId || app.status === status) return

    setUpdatingId(app.applicationId)
    setError(null)
    try {
      await updateApplicationStatus(app.applicationId, status)
      setApplications((prev) =>
        prev.map((item) =>
          item.applicationId === app.applicationId ? { ...item, status } : item,
        ),
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <EmployerLayout
      title="Job applications"
      subtitle="Review candidates, update hiring status, and access resumes from one workspace."
    >
      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Loading applications...</p>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Incoming applications will be organized in a professional review table."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={`No ${statusFilter.toLowerCase()} applications`}
          description="Select another status filter to see more candidates."
        />
      ) : (
        <ApplicationsTableShell
          title="Candidate pipeline"
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
                  <th className={applicationsTable.th}>Candidate</th>
                  <th className={applicationsTable.th}>Position</th>
                  <th className={applicationsTable.th}>Status</th>
                  <th className={applicationsTable.th}>Profile</th>
                  <th className={applicationsTable.th}>Submitted</th>
                  <th className={applicationsTable.th}>Resume</th>
                </tr>
              </thead>
              <tbody className={applicationsTable.tbody}>
                {filtered.map((app) => (
                  <tr
                    key={app.applicationId ?? `${app.jobId}-${app.email}-${app.appliedAt}`}
                    className={applicationsTable.row}
                  >
                    <td className={applicationsTable.td}>
                      <p className={applicationsTable.primary}>{app.applicantName}</p>
                      <p className={applicationsTable.secondary}>{app.email}</p>
                    </td>
                    <td className={applicationsTable.td}>
                      <p className={applicationsTable.primary}>{app.jobTitle}</p>
                      <p className={applicationsTable.secondary}>
                        {app.company} · {app.location}
                      </p>
                    </td>
                    <td className={applicationsTable.td}>
                      {app.applicationId && (
                        <ApplicationStatusSelect
                          value={app.status}
                          loading={updatingId === app.applicationId}
                          disabled={updatingId !== null && updatingId !== app.applicationId}
                          onChange={(status) => handleStatusChange(app, status)}
                        />
                      )}
                    </td>
                    <td className={applicationsTable.td}>
                      <p className={applicationsTable.muted}>
                        {app.yearsOfExperience} years · {app.educationLevel || '—'}
                      </p>
                      <p
                        className={`${applicationsTable.secondary} max-w-[200px] truncate`}
                        title={app.skills}
                      >
                        {app.skills || 'No skills listed'}
                      </p>
                    </td>
                    <td className={`${applicationsTable.td} whitespace-nowrap ${applicationsTable.muted}`}>
                      {formatDateTime(app.appliedAt)}
                    </td>
                    <td className={applicationsTable.td}>
                      {app.applicationId ? (
                        <CvActionButtons
                          applicationId={app.applicationId}
                          fileName={`${app.applicantName.replace(/\s+/g, '_')}_CV.pdf`}
                          compact
                        />
                      ) : (
                        <span className={applicationsTable.muted}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ApplicationsTableShell>
      )}
    </EmployerLayout>
  )
}
