import { Navigate, Route, Routes } from 'react-router-dom'
import { ApplicantRoute } from './components/auth/ApplicantRoute'
import { EmployerRoute } from './components/auth/EmployerRoute'
import { HomePage } from './pages/HomePage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { EmployerApplicationsPage } from './pages/employer/EmployerApplicationsPage'
import { EmployerJobsPage } from './pages/employer/EmployerJobsPage'
import { EmployerOverviewPage } from './pages/employer/EmployerOverviewPage'
import { ApplicantApplicationsPage } from './pages/applicant/ApplicantApplicationsPage'
import { ApplicantJobDetailPage } from './pages/applicant/ApplicantJobDetailPage'
import { ApplicantJobsPage } from './pages/applicant/ApplicantJobsPage'
import { ApplicantOverviewPage } from './pages/applicant/ApplicantOverviewPage'
import { ApplicantNotificationsPage } from './pages/applicant/ApplicantNotificationsPage'
import { ApplicantSavedJobsPage } from './pages/applicant/ApplicantSavedJobsPage'
import { EmployerJobDetailPage } from './pages/employer/EmployerJobDetailPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      <Route
        path="/employer/dashboard"
        element={
          <EmployerRoute>
            <EmployerOverviewPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/dashboard/jobs"
        element={
          <EmployerRoute>
            <EmployerJobsPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/dashboard/jobs/:jobId"
        element={
          <EmployerRoute>
            <EmployerJobDetailPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/dashboard/applications"
        element={
          <EmployerRoute>
            <EmployerApplicationsPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/dashboard/profile"
        element={
          <EmployerRoute>
            <ProfilePage />
          </EmployerRoute>
        }
      />

      <Route
        path="/applicant/dashboard"
        element={
          <ApplicantRoute>
            <ApplicantOverviewPage />
          </ApplicantRoute>
        }
      />
      <Route
        path="/applicant/dashboard/jobs"
        element={
          <ApplicantRoute>
            <ApplicantJobsPage />
          </ApplicantRoute>
        }
      />
      <Route
        path="/applicant/dashboard/jobs/:jobId"
        element={
          <ApplicantRoute>
            <ApplicantJobDetailPage />
          </ApplicantRoute>
        }
      />
      <Route
        path="/applicant/dashboard/applications"
        element={
          <ApplicantRoute>
            <ApplicantApplicationsPage />
          </ApplicantRoute>
        }
      />
      <Route
        path="/applicant/dashboard/saved"
        element={
          <ApplicantRoute>
            <ApplicantSavedJobsPage />
          </ApplicantRoute>
        }
      />
      <Route
        path="/applicant/dashboard/notifications"
        element={
          <ApplicantRoute>
            <ApplicantNotificationsPage />
          </ApplicantRoute>
        }
      />
      <Route
        path="/applicant/dashboard/profile"
        element={
          <ApplicantRoute>
            <ProfilePage />
          </ApplicantRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
