import type { UpdateProfilePayload, UserProfile } from '../types/profile'
import type { AuthUser } from '../types/auth'
import { normalizeAuthUser } from '../lib/authUser'
import { getProfileImageDisplayUrl } from '../lib/profileImage'
import { getToken } from '../lib/authStorage'
import { apiGet, apiPut, ApiError } from './client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5046'

function normalizeProfile(raw: Record<string, unknown>): UserProfile {
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    fullName: String(raw.fullName ?? raw.FullName ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    role: (raw.role ?? raw.Role ?? 'Applicant') as UserProfile['role'],
    profileImageUrl: getProfileImageDisplayUrl(
      String(raw.profileImageUrl ?? raw.ProfileImageUrl ?? ''),
      String(raw.profileImageUrlStored ?? raw.ProfileImageUrlStored ?? ''),
    ),
    profileImageUrlStored: String(
      raw.profileImageUrlStored ?? raw.ProfileImageUrlStored ?? '',
    ),
    hasProfileImage:
      Boolean(raw.hasProfileImage ?? raw.HasProfileImage) ||
      Boolean(raw.profileImageUrlStored ?? raw.ProfileImageUrlStored),
  }
}

/** Load profile photo through API when Cloudinary URLs fail in the browser. */
export async function fetchProfilePhotoBlob(): Promise<string> {
  const token = getToken()
  if (!token) {
    throw new ApiError('You must be signed in to load your profile photo.', 401)
  }

  const response = await fetch(`${API_URL}/api/profile/photo`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new ApiError('Could not load profile photo', response.status)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

export async function getProfile(): Promise<UserProfile> {
  const data = await apiGet<Record<string, unknown>>('/api/profile')
  return normalizeProfile(data)
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const data = await apiPut<{ message: string; user: Record<string, unknown> }>(
    '/api/profile',
    payload,
  )
  return {
    message: data.message,
    user: normalizeProfile(data.user),
  }
}

export function profileToAuthUser(profile: UserProfile): AuthUser {
  return normalizeAuthUser({
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    role: profile.role,
    profileImageUrl: profile.profileImageUrl,
    profileImageUrlStored: profile.profileImageUrlStored,
    hasProfileImage: profile.hasProfileImage,
  })
}
