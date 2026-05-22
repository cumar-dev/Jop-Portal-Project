import { Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2 font-semibold text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Briefcase className="h-4 w-4" />
              </span>
              JobPortal
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A modern platform connecting talented professionals with companies that
              value growth, clarity, and meaningful work.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">Product</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>
                  <a href="#features" className="transition hover:text-brand-600">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition hover:text-brand-600">
                    How it works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">Account</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>
                  <Link to="/sign-in" className="transition hover:text-brand-600">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/sign-up" className="transition hover:text-brand-600">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">Roles</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>Job seekers</li>
                <li>Employers</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} JobPortal. All rights reserved.
          </p>
          <p className="text-xs text-muted">Built for your job portal project</p>
        </div>
      </div>
    </footer>
  )
}
