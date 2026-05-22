import { useEffect, useState, type FormEvent } from 'react'
import { Briefcase, Building2, MapPin, Timer } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { FormInput } from '../auth/FormInput'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { JobCoverImageField } from './JobCoverImageField'
import { getJobCoverSrc, getJobImageUrlOriginal } from '../../lib/job'
import type { Job, JobFormData } from '../../types/job'
import { ApiError } from '../../api/client'
import { createJob, updateJob } from '../../api/jobs'

const emptyForm: JobFormData = {
  title: '',
  company: '',
  location: '',
  experience: '',
  description: '',
  imageUrl: '',
}

interface JobFormModalProps {
  open: boolean
  onClose: () => void
  job?: Job | null
  onSaved: () => void
}

export function JobFormModal({ open, onClose, job, onSaved }: JobFormModalProps) {
  const isEdit = Boolean(job?.id)
  const [form, setForm] = useState<JobFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    setApiError(null)
    setErrors({})
    if (job) {
      setForm({
        title: job.title,
        company: job.company,
        location: job.location,
        experience: job.experience,
        description: job.description,
        imageUrl: getJobImageUrlOriginal(job),
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, job])

  function validate() {
    const next: Partial<Record<keyof JobFormData, string>> = {}
    if (coverUploading) next.imageUrl = 'Please wait for the cover image to finish uploading'
    else if (!form.imageUrl.trim()) next.imageUrl = 'Cover image is required'
    if (!form.title.trim()) next.title = 'Title is required'
    if (!form.company.trim()) next.company = 'Company is required'
    if (!form.location.trim()) next.location = 'Location is required'
    if (!form.experience.trim()) next.experience = 'Experience level is required'
    if (!form.description.trim()) next.description = 'Description is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return

    setLoading(true)
    try {
      if (isEdit && job?.id) {
        await updateJob(job.id, form)
      } else {
        await createJob(form)
      }
      onSaved()
      onClose()
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : 'Could not save job. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function setField<K extends keyof JobFormData>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit job posting' : 'Post a new job'}
      description={
        isEdit
          ? 'Update the cover and job details, then save your changes.'
          : 'Add a cover image and complete the form to publish your listing.'
      }
      xl
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {apiError && <Alert variant="error" message={apiError} />}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80">
            <div className="border-b border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Cover image
              </p>
              <p className="mt-0.5 text-xs text-muted">Shown on job cards and the detail page</p>
            </div>
            <JobCoverImageField
              compact
              value={form.imageUrl}
              signedViewUrl={job ? getJobCoverSrc(job) : undefined}
              onChange={(url) => {
                setField('imageUrl', url)
                if (url) {
                  setErrors((prev) => {
                    const { imageUrl: _, ...rest } = prev
                    return rest
                  })
                }
              }}
              onUploadingChange={setCoverUploading}
              disabled={loading}
              error={errors.imageUrl}
            />
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Job information
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormInput
                    label="Job title"
                    name="title"
                    placeholder="e.g. Senior Software Engineer"
                    value={form.title}
                    onChange={(e) => setField('title', e.target.value)}
                    error={errors.title}
                    disabled={loading}
                  />
                </div>
                <FormInput
                  label="Company"
                  name="company"
                  placeholder="Your company name"
                  value={form.company}
                  onChange={(e) => setField('company', e.target.value)}
                  error={errors.company}
                  disabled={loading}
                />
                <FormInput
                  label="Location"
                  name="location"
                  placeholder="e.g. Remote, Nairobi"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  error={errors.location}
                  disabled={loading}
                />
                <div className="sm:col-span-2">
                  <FormInput
                    label="Experience required"
                    name="experience"
                    placeholder="e.g. 3+ years"
                    value={form.experience}
                    onChange={(e) => setField('experience', e.target.value)}
                    error={errors.experience}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <label
                htmlFor="description"
                className="block text-xs font-semibold uppercase tracking-wider text-brand-600"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                placeholder="Describe responsibilities, requirements, and benefits..."
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                disabled={loading}
                className={`mt-3 w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-relaxed text-ink shadow-sm transition outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60 ${
                  errors.description ? 'border-red-300' : 'border-slate-200'
                }`}
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            <ul className="grid gap-2 text-xs text-muted sm:grid-cols-2">
              <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                Clear job title helps applicants find you
              </li>
              <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                Company name appears on every listing
              </li>
              <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                Include remote or on-site in location
              </li>
              <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Timer className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                Experience sets candidate expectations
              </li>
            </ul>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={coverUploading}
            className="sm:w-auto sm:min-w-[160px]"
          >
            {isEdit ? 'Save changes' : 'Publish job'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
