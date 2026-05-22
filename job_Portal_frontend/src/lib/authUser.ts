import type { AuthUser } from '../types/auth'
import { getProfileImageDisplayUrl } from './profileImage'

export function normalizeAuthUser(raw: Record<string, unknown> | AuthUser): AuthUser {
  const stored = String(raw.profileImageUrlStored ?? raw.ProfileImageUrlStored ?? '').trim()
  const view = String(raw.profileImageUrl ?? raw.ProfileImageUrl ?? '').trim()

  return {
    id: String(raw.id ?? raw.Id ?? '') || undefined,
    fullName: String(raw.fullName ?? raw.FullName ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    role: (raw.role ?? raw.Role ?? 'Applicant') as AuthUser['role'],
    profileImageUrl: getProfileImageDisplayUrl(view, stored),
    profileImageUrlStored: stored,
    hasProfileImage:
      Boolean(raw.hasProfileImage ?? raw.HasProfileImage) || Boolean(stored || view),
  }
}
