import { useEffect, useMemo, useState } from 'react'
import { Briefcase } from 'lucide-react'
import { getJobCoverCandidates, jobHasCover } from '../../lib/job'
import type { Job } from '../../types/job'

interface JobCardImageProps {
  job: Job
  className?: string
}

function CoverPlaceholder({ job, className }: JobCardImageProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br from-slate-100 to-slate-50 ${className}`}
    >
      {job.company ? (
        <span className="text-3xl font-bold text-slate-300">
          {job.company.charAt(0).toUpperCase()}
        </span>
      ) : (
        <Briefcase className="h-10 w-10 text-slate-300" />
      )}
    </div>
  )
}

export function JobCardImage({ job, className = 'h-36 w-full' }: JobCardImageProps) {
  const candidates = useMemo(() => getJobCoverCandidates(job), [job])
  const [srcIndex, setSrcIndex] = useState(0)
  const [exhausted, setExhausted] = useState(false)

  useEffect(() => {
    setSrcIndex(0)
    setExhausted(false)
  }, [job.id, candidates.join('|')])

  const imageUrl = candidates[srcIndex]

  function handleError() {
    if (srcIndex + 1 < candidates.length) {
      setSrcIndex((i) => i + 1)
      return
    }
    setExhausted(true)
  }

  if (!jobHasCover(job) || exhausted || !imageUrl) {
    return <CoverPlaceholder job={job} className={className} />
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img
        key={`${job.id}-${srcIndex}-${imageUrl}`}
        src={imageUrl}
        alt={`${job.title} cover`}
        className="h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
        onError={handleError}
      />
    </div>
  )
}
