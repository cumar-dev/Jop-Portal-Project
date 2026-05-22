import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormInput } from '../components/auth/FormInput'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { normalizeAuthUser } from '../lib/authUser'
import { saveSession } from '../lib/authStorage'

export function SignInPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address'
    }
    if (!password) errors.password = 'Password is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const data = await login({
        email: email.trim().toLowerCase(),
        password,
      })
      const token = data.token ?? (data as { Token?: string }).Token
      const user = data.user ?? (data as { User?: typeof data.user }).User
      if (!token || !user) {
        setApiError('Sign-in response was incomplete. Please try again.')
        return
      }
      saveSession(token, normalizeAuthUser(user as Record<string, unknown>))
      if (user.role === 'Employer') {
        navigate('/employer/dashboard', { replace: true })
      } else {
        navigate('/applicant/dashboard', { replace: true })
      }
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
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/sign-up" className="font-medium text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {apiError && <Alert variant="error" message={apiError} />}

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
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          disabled={loading}
        />

        <Button type="submit" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}
