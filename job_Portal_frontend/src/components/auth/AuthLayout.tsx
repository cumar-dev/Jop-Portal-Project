import { Briefcase, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ThemeToggle } from '../ui/ThemeToggle'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

const highlights = [
  {
    icon: Briefcase,
    title: 'Curated opportunities',
    text: 'Roles from trusted employers, updated daily.',
  },
  {
    icon: Users,
    title: 'Built for everyone',
    text: 'Hire talent or land your next career move.',
  },
  {
    icon: Sparkles,
    title: 'Fast & simple',
    text: 'Create a profile and apply in minutes.',
  },
]

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[44%] overflow-hidden bg-linear-to-br from-brand-900 via-brand-700 to-brand-500 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
        </div>

        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Briefcase className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-lg font-semibold tracking-tight">JobPortal</span>
          </Link>

          <div className="mt-20 max-w-md">
            <h1 className="font-display text-5xl leading-tight text-white">
              Your career,
              <br />
              <em className="not-italic text-brand-100">elevated.</em>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-brand-100/90">
              Connect with employers and applicants on a platform designed for clarity,
              speed, and professional growth.
            </p>
          </div>
        </div>

        <ul className="relative z-10 space-y-5 p-12 pt-0">
          {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
            <li
              key={itemTitle}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-5 w-5 text-white" />
              </span>
              <div>
                <p className="font-medium text-white">{itemTitle}</p>
                <p className="mt-0.5 text-sm text-brand-100/80">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="relative flex flex-1 flex-col justify-center bg-surface px-6 py-12 sm:px-10 lg:px-16">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle compact />
        </div>

        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-brand-600 lg:hidden dark:text-brand-400"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-100/30">
              <Briefcase className="h-4 w-4" />
            </span>
            <span className="font-semibold text-ink">JobPortal</span>
          </Link>

          <header className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-ink">{title}</h2>
            <p className="mt-2 text-muted">{subtitle}</p>
          </header>

          {children}

          <footer className="mt-8 text-center text-sm text-muted">{footer}</footer>
        </div>
      </main>
    </div>
  )
}
