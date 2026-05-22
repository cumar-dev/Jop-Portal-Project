import type { ReactNode } from 'react'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'
import { applicationsTable } from './applicationsTableStyles'
import { ApplicationsTableShell } from './ApplicationsTableShell'
import type { ApplicationListItem } from '../../types/job'
import { formatDateTime } from '../../lib/format'

interface RecentApplicationsTableProps {
  applications: ApplicationListItem[]
  variant: 'applicant' | 'employer'
  footer?: ReactNode
  /** Extra columns or actions for employer rows */
  renderEmployerStatus?: (app: ApplicationListItem) => ReactNode
}

export function RecentApplicationsTable({
  applications,
  variant,
  footer,
  renderEmployerStatus,
}: RecentApplicationsTableProps) {
  const rows = applications.slice(0, 5)

  return (
    <ApplicationsTableShell
      title="Recent applications"
      meta={`Last ${rows.length} submission${rows.length === 1 ? '' : 's'}`}
      footer={footer}
    >
      <div className={applicationsTable.scroll}>
        <table className={applicationsTable.table}>
          <thead className={applicationsTable.thead}>
            <tr>
              {variant === 'employer' ? (
                <>
                  <th className={applicationsTable.th}>Candidate</th>
                  <th className={applicationsTable.th}>Position</th>
                  <th className={applicationsTable.th}>Status</th>
                  <th className={applicationsTable.th}>Experience</th>
                  <th className={applicationsTable.th}>Submitted</th>
                </>
              ) : (
                <>
                  <th className={applicationsTable.th}>Position</th>
                  <th className={applicationsTable.th}>Company</th>
                  <th className={applicationsTable.th}>Location</th>
                  <th className={applicationsTable.th}>Status</th>
                  <th className={applicationsTable.th}>Experience</th>
                  <th className={applicationsTable.th}>Submitted</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className={applicationsTable.tbody}>
            {rows.map((app) => (
              <tr
                key={app.applicationId ?? `${app.jobId}-${app.appliedAt}`}
                className={applicationsTable.row}
              >
                {variant === 'employer' ? (
                  <>
                    <td className={applicationsTable.td}>
                      <p className={applicationsTable.primary}>{app.applicantName}</p>
                      <p className={applicationsTable.secondary}>{app.email}</p>
                    </td>
                    <td className={applicationsTable.td}>
                      <p className={applicationsTable.primary}>{app.jobTitle}</p>
                      <p className={applicationsTable.secondary}>{app.location}</p>
                    </td>
                    <td className={applicationsTable.td}>
                      {renderEmployerStatus ? (
                        renderEmployerStatus(app)
                      ) : (
                        <ApplicationStatusBadge status={app.status} />
                      )}
                    </td>
                    <td className={`${applicationsTable.td} ${applicationsTable.muted}`}>
                      {app.yearsOfExperience} yrs
                    </td>
                    <td className={`${applicationsTable.td} whitespace-nowrap ${applicationsTable.muted}`}>
                      {formatDateTime(app.appliedAt)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className={applicationsTable.td}>
                      <p className={applicationsTable.primary}>{app.jobTitle}</p>
                    </td>
                    <td className={`${applicationsTable.td} ${applicationsTable.muted}`}>
                      {app.company}
                    </td>
                    <td className={`${applicationsTable.td} ${applicationsTable.muted}`}>
                      {app.location}
                    </td>
                    <td className={applicationsTable.td}>
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className={`${applicationsTable.td} ${applicationsTable.muted}`}>
                      {app.yearsOfExperience} yrs
                    </td>
                    <td className={`${applicationsTable.td} whitespace-nowrap ${applicationsTable.muted}`}>
                      {formatDateTime(app.appliedAt)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ApplicationsTableShell>
  )
}
