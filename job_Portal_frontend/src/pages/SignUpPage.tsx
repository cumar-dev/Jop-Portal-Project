import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormInput } from '../components/auth/FormInput'
import { RoleSelector } from '../components/auth/RoleSelector'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import type { UserRole } from '../types/auth'

export function SignUpPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('Applicant')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Full name is required'
    if (!email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address'
    }
    if (!password) errors.password = 'Password is required'
    else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError(null)
    setSuccessMessage(null)
    if (!validate()) return

    setLoading(true)
    try {
      const data = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      })
      setSuccessMessage(data.message)
      setTimeout(() => navigate('/sign-in', { replace: true }), 1500)
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message)
      } else {
        setApiError('Unable to reach the server. Is the API running on port 5046?')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join as a job seeker or employer — it only takes a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {apiError && <Alert variant="error" message={apiError} />}
        {successMessage && <Alert variant="success" message={successMessage} />}

        <RoleSelector value={role} onChange={setRole} disabled={loading} />

        <FormInput
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Jane Cooper"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldErrors.fullName}
          disabled={loading}
        />

        <FormInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          disabled={loading}
        />

        <FormInput
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="Use a strong password you don't use elsewhere."
          disabled={loading}
        />

        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
