import { useEffect, useState, type FormEvent } from 'react'
import { updateApplication } from '../../api/applications'
import { ApiError } from '../../api/client'
import { getCvViewUrl } from '../../lib/application'
import type { ApplicationListItem } from '../../types/job'
import { FormInput } from '../auth/FormInput'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { FileUploadField } from '../ui/FileUploadField'
import { Modal } from '../ui/Modal'

interface EditApplicationModalProps {
  open: boolean
  onClose: () => void
  application: ApplicationListItem | null
  onSaved: () => void
}

export function EditApplicationModal({
  open,
  onClose,
  application,
  onSaved,
}: EditApplicationModalProps) {
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [skills, setSkills] = useState('')
  const [educationLevel, setEducationLevel] = useState('')
  const [message, setMessage] = useState('')
  const [cvFileUrl, setCvFileUrl] = useState('')
  const [existingCvUrl, setExistingCvUrl] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !application) return

    setYearsOfExperience(String(application.yearsOfExperience ?? ''))
    setSkills(application.skills ?? '')
    setEducationLevel(application.educationLevel ?? '')
    setMessage(application.message ?? '')
    const storedCv =
      application.cvFileUrlStored ||
      application.cvFileUrl ||
      getCvViewUrl(application) ||
      ''
    setExistingCvUrl(storedCv)
    setCvFileUrl(storedCv)
    setErrors({})
    setApiError(null)
  }, [open, application])

  function validate() {
    const next: Record<string, string> = {}
    const years = Number(yearsOfExperience)
    if (!yearsOfExperience.trim() || Number.isNaN(years) || years < 0) {
      next.yearsOfExperience = 'Enter valid years of experience'
    }
    if (!skills.trim()) next.skills = 'Skills are required'
    if (!educationLevel.trim()) next.educationLevel = 'Education level is required'
    if (!cvFileUrl.trim() && !existingCvUrl.trim()) {
      next.cvFileUrl = 'Please upload your CV'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!application?.applicationId || !application.jobId) return

    setApiError(null)
    if (!validate()) return

    setLoading(true)
    try {
      await updateApplication(application.applicationId, {
        jobId: application.jobId,
        yearsOfExperience: Number(yearsOfExperience),
        skills: skills.trim(),
        educationLevel: educationLevel.trim(),
        cvFileUrl:
          cvFileUrl.trim() ||
          application.cvFileUrlStored ||
          existingCvUrl,
        message: message.trim(),
      })
      onSaved()
      onClose()
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Could not update application.')
    } finally {
      setLoading(false)
    }
  }

  if (!application) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit application"
      description={`${application.jobTitle} at ${application.company}`}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {apiError && <Alert variant="error" message={apiError} />}

          <FileUploadField
            value={cvFileUrl}
            onChange={(url) => {
              setCvFileUrl(url)
              if (url) {
                setErrors((prev) => {
                  const { cvFileUrl: _, ...rest } = prev
                  return rest
                })
              }
            }}
            disabled={loading}
            error={errors.cvFileUrl}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Years of experience"
              name="yearsOfExperience"
              type="number"
              min={0}
              placeholder="e.g. 3"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              error={errors.yearsOfExperience}
              disabled={loading}
            />
            <FormInput
              label="Education level"
              name="educationLevel"
              placeholder="e.g. Master's degree"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              error={errors.educationLevel}
              disabled={loading}
            />
          </div>

          <FormInput
            label="Skills"
            name="skills"
            placeholder="e.g. CCNA, CCNP, Security"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            error={errors.skills}
            disabled={loading}
          />

          <div className="space-y-1.5">
            <label htmlFor="edit-message" className="block text-sm font-medium text-ink">
              Cover message <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="edit-message"
              rows={4}
              placeholder="Tell the employer why you're a great fit..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Save changes
            </Button>
          </div>
      </form>
    </Modal>
  )
}
