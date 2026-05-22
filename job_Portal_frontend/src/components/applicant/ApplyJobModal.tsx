import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { FormInput } from '../auth/FormInput'
import { FileUploadField } from '../ui/FileUploadField'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { applyForJob } from '../../api/applications'
import { ApiError } from '../../api/client'
import type { Job } from '../../types/job'

interface ApplyJobModalProps {
  open: boolean
  onClose: () => void
  job: Job | null
  onApplied: () => void
}

export function ApplyJobModal({ open, onClose, job, onApplied }: ApplyJobModalProps) {
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [skills, setSkills] = useState('')
  const [educationLevel, setEducationLevel] = useState('')
  const [message, setMessage] = useState('')
  const [cvFileUrl, setCvFileUrl] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setYearsOfExperience('')
    setSkills('')
    setEducationLevel('')
    setMessage('')
    setCvFileUrl('')
    setErrors({})
    setApiError(null)
  }, [open, job?.id])

  function validate() {
    const next: Record<string, string> = {}
    const years = Number(yearsOfExperience)
    if (!yearsOfExperience.trim() || Number.isNaN(years) || years < 0) {
      next.yearsOfExperience = 'Enter valid years of experience'
    }
    if (!skills.trim()) next.skills = 'Skills are required'
    if (!educationLevel.trim()) next.educationLevel = 'Education level is required'
    if (!cvFileUrl.trim()) next.cvFileUrl = 'Please upload your CV'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!job?.id) return
    setApiError(null)
    if (!validate()) return

    setLoading(true)
    try {
      await applyForJob({
        jobId: job.id,
        yearsOfExperience: Number(yearsOfExperience),
        skills: skills.trim(),
        educationLevel: educationLevel.trim(),
        cvFileUrl,
        message: message.trim(),
      })
      onApplied()
      onClose()
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Could not submit application.')
    } finally {
      setLoading(false)
    }
  }

  if (!job) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply for this role"
      description={`${job.title} at ${job.company}`}
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
            placeholder="e.g. Bachelor's degree"
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
            error={errors.educationLevel}
            disabled={loading}
          />
        </div>

        <FormInput
          label="Skills"
          name="skills"
          placeholder="e.g. React, TypeScript, Node.js"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          error={errors.skills}
          disabled={loading}
        />

        <div className="space-y-1.5">
          <label htmlFor="message" className="block text-sm font-medium text-ink">
            Cover message <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="message"
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
            Submit application
          </Button>
        </div>
      </form>
    </Modal>
  )
}
