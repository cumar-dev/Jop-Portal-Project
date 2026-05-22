import type { UserRole } from './auth'

export interface UserProfile {
  id: string
  fullName: string
  email: string
  role: UserRole
  profileImageUrl: string
  profileImageUrlStored: string
  hasProfileImage: boolean
}

export interface UpdateProfilePayload {
  fullName: string
  profileImageUrl?: string
}
