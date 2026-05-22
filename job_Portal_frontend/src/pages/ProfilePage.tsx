import { useEffect, useState, type FormEvent } from 'react'
import { getProfile, profileToAuthUser, updateProfile } from '../api/profile'
import { ApiError } from '../api/client'
import { ApplicantLayout } from '../components/applicant/ApplicantLayout'
import { EmployerLayout } from '../components/employer/EmployerLayout'
import { FormInput } from '../components/auth/FormInput'
import { ProfileAvatarUpload } from '../components/profile/ProfileAvatarUpload'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { getStoredUser, getToken, updateStoredUser } from '../lib/authStorage'

export function ProfilePage() {
  const stored = getStoredUser()
  const isEmployer = stored?.role === 'Employer'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [profileImageStored, setProfileImageStored] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!getToken()) return
      setLoading(true)
      setError(null)
      try {
        const profile = await getProfile()
        setFullName(profile.fullName)
        setEmail(profile.email)
        setRole(profile.role)
        setProfileImageUrl(profile.profileImageUrl)
        setProfileImageStored(profile.profileImageUrlStored)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await updateProfile({
        fullName: fullName.trim(),
        profileImageUrl: profileImageStored,
      })
      const authUser = profileToAuthUser(result.user)
      updateStoredUser(authUser)
      setProfileImageUrl(result.user.profileImageUrl)
      setProfileImageStored(result.user.profileImageUrlStored)
      setSuccess('Profile saved successfully.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <>
      {error && <Alert variant="error" message={error} />}
      {success && <Alert variant="success" message={success} />}

      {loading ? (
        <p className="text-center text-sm text-muted">Loading profile...</p>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-8">
          <section className="app-panel p-6">
            <ProfileAvatarUpload
              imageUrl={profileImageUrl}
              storedUrl={profileImageStored}
              fullName={fullName}
              disabled={saving}
              onChange={(stored, view) => {
                setProfileImageStored(stored)
                setProfileImageUrl(view)
              }}
              onUploadSaved={async (stored) => {
                try {
                  const result = await updateProfile({
                    fullName: fullName.trim(),
                    profileImageUrl: stored,
                  })
                  const authUser = profileToAuthUser(result.user)
                  updateStoredUser(authUser)
                  setProfileImageUrl(result.user.profileImageUrl)
                  setProfileImageStored(result.user.profileImageUrlStored)
                } catch (err) {
                  setError(
                    err instanceof ApiError
                      ? `${err.message} — click Save profile to retry.`
                      : 'Photo uploaded but not saved. Click Save profile.',
                  )
                }
              }}
            />
          </section>

          <section className="app-panel space-y-4 p-6">
            <h2 className="text-sm font-semibold text-ink">Account details</h2>
            <FormInput
              label="Full name"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={saving}
              required
            />
            <FormInput label="Email" name="email" value={email} disabled readOnly />
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-ink">Role</span>
              <p className="rounded-xl border border-border bg-subtle px-4 py-3 text-sm text-muted">
                {role}
              </p>
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving} className="sm:min-w-[10rem]">
              Save profile
            </Button>
          </div>
        </form>
      )}
    </>
  )

  if (isEmployer) {
    return (
      <EmployerLayout title="My profile" subtitle="Update your photo and account details.">
        {content}
      </EmployerLayout>
    )
  }

  return (
    <ApplicantLayout title="My profile" subtitle="Update your photo and account details.">
      {content}
    </ApplicantLayout>
  )
}
