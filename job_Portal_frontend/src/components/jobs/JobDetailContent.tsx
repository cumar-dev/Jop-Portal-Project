import type { ReactNode } from 'react'
import { Briefcase, MapPin } from 'lucide-react'
import { JobCardImage } from './JobCardImage'
import type { Job } from '../../types/job'

interface JobDetailContentProps {
  job: Job
  actions?: ReactNode
}

export function JobDetailContent({ job, actions }: JobDetailContentProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <JobCardImage job={job} className="h-48 w-full sm:h-64 md:h-80" />
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">{job.title}</h2>
            <p className="mt-2 text-lg font-medium text-brand-600">{job.company}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 shrink-0 text-brand-500" />
                {job.experience} experience
              </span>
            </div>
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
              {actions}
            </div>
          )}
        </div>

        <section className="mt-8 border-t border-slate-100 pt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Job description
          </h3>
          <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-ink">
            {job.description}
          </div>
        </section>
      </div>
    </article>
  )
}
