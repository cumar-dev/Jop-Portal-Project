import { useEffect, useMemo, useState } from 'react'
import { User } from 'lucide-react'
import { getProfileImageDisplayUrl } from '../../lib/profileImage'

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-11 w-11 text-sm',
} as const

const radiusClasses = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const

interface UserAvatarProps {
  fullName: string
  profileImageUrl?: string
  profileImageUrlStored?: string
  size?: keyof typeof sizeClasses
  rounded?: keyof typeof radiusClasses
  className?: string
}

export function UserAvatar({
  fullName,
  profileImageUrl,
  profileImageUrlStored,
  size = 'md',
  rounded = 'lg',
  className = '',
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false)

  const src = useMemo(
    () => getProfileImageDisplayUrl(profileImageUrl, profileImageUrlStored),
    [profileImageUrl, profileImageUrlStored],
  )

  useEffect(() => {
    setFailed(false)
  }, [src])

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const box = `${sizeClasses[size]} ${radiusClasses[rounded]} ${className}`.trim()

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className={`${box} shrink-0 object-cover`}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      className={`${box} flex shrink-0 items-center justify-center bg-linear-to-br from-brand-600 to-brand-700 font-bold text-white`}
    >
      {initials || <User className="h-4 w-4 opacity-80" />}
    </span>
  )
}
