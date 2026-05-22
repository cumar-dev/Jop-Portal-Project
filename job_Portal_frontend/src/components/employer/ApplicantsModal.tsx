import { useEffect, useState } from 'react'

import { getApplicantsForJob, updateApplicationStatus } from '../../api/applications'

import { ApiError } from '../../api/client'

import { ApplicationStatusSelect } from '../shared/ApplicationStatusSelect'

import { ApplicationsTableShell } from '../shared/ApplicationsTableShell'

import { applicationsTable } from '../shared/applicationsTableStyles'

import { CvActionButtons } from '../shared/CvActionButtons'

import type { JobApplicationDetail } from '../../types/job'

import type { ApplicationStatus } from '../../lib/applicationStatus'

import { formatDateTime } from '../../lib/format'

import { Modal } from '../ui/Modal'

import { Alert } from '../ui/Alert'



interface ApplicantsModalProps {

  open: boolean

  onClose: () => void

  jobId: string | null

  jobTitle: string

}



export function ApplicantsModal({ open, onClose, jobId, jobTitle }: ApplicantsModalProps) {

  const [applicants, setApplicants] = useState<JobApplicationDetail[]>([])

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [updatingId, setUpdatingId] = useState<string | null>(null)



  useEffect(() => {

    if (!open || !jobId) return

    setLoading(true)

    setError(null)

    getApplicantsForJob(jobId)

      .then(setApplicants)

      .catch((err) => {

        setApplicants([])

        setError(err instanceof ApiError ? err.message : 'Failed to load applicants')

      })

      .finally(() => setLoading(false))

  }, [open, jobId])



  async function handleStatusChange(app: JobApplicationDetail, status: ApplicationStatus) {

    if (!app.id || app.status === status) return



    setUpdatingId(app.id)

    setError(null)

    try {

      await updateApplicationStatus(app.id, status)

      setApplicants((prev) =>

        prev.map((item) => (item.id === app.id ? { ...item, status } : item)),

      )

    } catch (err) {

      setError(err instanceof ApiError ? err.message : 'Could not update status')

    } finally {

      setUpdatingId(null)

    }

  }



  return (

    <Modal

      open={open}

      onClose={onClose}

      title="Applicants"

      description={jobTitle}

      xl

    >

      {loading && (

        <p className="py-12 text-center text-sm text-muted">Loading applicants...</p>

      )}

      {error && <Alert variant="error" message={error} />}

      {!loading && !error && applicants.length === 0 && (

        <p className="py-12 text-center text-sm text-muted">

          No applications for this job yet.

        </p>

      )}

      {!loading && applicants.length > 0 && (

        <ApplicationsTableShell

          title="Applicants for this role"

          meta={`${applicants.length} candidate${applicants.length === 1 ? '' : 's'}`}

        >

          <div>

            <table className={applicationsTable.tableCompact}>

              <colgroup>

                <col className="w-[24%]" />

                <col className="w-[14%]" />

                <col className="w-[28%]" />

                <col className="w-[18%]" />

                <col className="w-[16%]" />

              </colgroup>

              <thead className={applicationsTable.thead}>

                <tr>

                  <th className={applicationsTable.thCompact}>Candidate</th>

                  <th className={applicationsTable.thCompact}>Status</th>

                  <th className={applicationsTable.thCompact}>Profile</th>

                  <th className={applicationsTable.thCompact}>Submitted</th>

                  <th className={applicationsTable.thCompact}>Resume</th>

                </tr>

              </thead>

              <tbody className={applicationsTable.tbody}>

                {applicants.map((app) => (

                  <tr key={app.id} className={applicationsTable.row}>

                    <td className={applicationsTable.tdCompact}>

                      <p className={`${applicationsTable.primary} truncate`} title={app.applicantName}>

                        {app.applicantName}

                      </p>

                      <p className={`${applicationsTable.secondary} truncate`} title={app.email}>

                        {app.email}

                      </p>

                    </td>

                    <td className={applicationsTable.tdCompact}>

                      {app.id && (

                        <ApplicationStatusSelect

                          value={app.status}

                          loading={updatingId === app.id}

                          disabled={updatingId !== null && updatingId !== app.id}

                          onChange={(status) => handleStatusChange(app, status)}

                        />

                      )}

                    </td>

                    <td className={applicationsTable.tdCompact}>

                      <p className={`${applicationsTable.muted} truncate`}>

                        {app.yearsOfExperience} years · {app.educationLevel || '—'}

                      </p>

                      <p

                        className={`${applicationsTable.secondary} truncate`}

                        title={app.skills}

                      >

                        {app.skills || '—'}

                      </p>

                      {app.message && (

                        <p className={`${applicationsTable.secondary} mt-1 truncate`} title={app.message}>

                          {app.message}

                        </p>

                      )}

                    </td>

                    <td className={`${applicationsTable.tdCompact} whitespace-nowrap text-xs ${applicationsTable.muted}`}>

                      {formatDateTime(app.appliedAt)}

                    </td>

                    <td className={applicationsTable.tdCompact}>

                      <CvActionButtons

                        applicationId={app.id}

                        fileName={`${app.applicantName.replace(/\s+/g, '_')}_CV.pdf`}

                        compact

                        stacked

                      />

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </ApplicationsTableShell>

      )}

    </Modal>

  )

}


