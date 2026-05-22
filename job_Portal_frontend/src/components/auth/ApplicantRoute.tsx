import { Navigate, useLocation } from 'react-router-dom'
import { getStoredUser, getToken } from '../../lib/authStorage'
import type { ReactNode } from 'react'

export function ApplicantRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const token = getToken()
  const user = getStoredUser()

  if (!token || !user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
  }

  if (user.role !== 'Applicant') {
    return <Navigate to="/" replace />
  }

  return children
}
