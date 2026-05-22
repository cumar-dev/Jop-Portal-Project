export type UserRole = 'Applicant' | 'Employer'

export interface AuthUser {
  id?: string
  fullName: string
  email: string
  role: UserRole
  profileImageUrl?: string
  profileImageUrlStored?: string
  hasProfileImage?: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  role: UserRole
}

export interface LoginResponse {
  message: string
  token: string
  user: AuthUser & { id: string }
}

export interface RegisterResponse {
  message: string
  user: AuthUser
}
