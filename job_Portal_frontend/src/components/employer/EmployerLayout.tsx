import { Link, useLocation } from 'react-router-dom'
import {
  Briefcase,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { UserAvatar } from '../shared/UserAvatar'
import { ThemeToggle } from '../ui/ThemeToggle'
import { clearSession, getStoredUser } from '../../lib/authStorage'

const navItems = [
  { to: '/employer/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/employer/dashboard/jobs', label: 'My jobs', icon: Briefcase, end: false },
  {
    to: '/employer/dashboard/applications',
    label: 'Job applications',
    icon: FileText,
    end: false,
  },
  { to: '/employer/dashboard/profile', label: 'Profile', icon: UserCircle, end: false },
]

interface EmployerLayoutProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export function EmployerLayout({ title, subtitle, action, children }: EmployerLayoutProps) {
  const [user, setUser] = useState(getStoredUser)
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser())
    syncUser()
    window.addEventListener('user-profile-updated', syncUser)
    return () => window.removeEventListener('user-profile-updated', syncUser)
  }, [location.pathname])

  function handleLogout() {
    clearSession()
    window.location.href = '/sign-in'
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden dark:bg-black/60"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-elevated transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Link to="/" className="inline-flex items-center gap-2.5 font-semibold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Briefcase className="h-4 w-4" />
            </span>
            JobPortal
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-muted lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive =
              to === '/employer/dashboard'
                ? location.pathname === '/employer/dashboard'
                : location.pathname.startsWith(to)

            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-100/20 dark:text-brand-300'
                    : 'text-muted hover:bg-subtle hover:text-ink'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : ''}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            to="/employer/dashboard/profile"
            className="flex items-center gap-3 rounded-xl bg-subtle p-3 transition hover:bg-subtle/80"
          >
            <UserAvatar
              fullName={user?.fullName ?? ''}
              profileImageUrl={user?.profileImageUrl}
              profileImageUrlStored={user?.profileImageUrlStored}
              size="md"
              rounded="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user?.fullName}</p>
              <p className="truncate text-xs text-muted">Employer</p>
            </div>
          </Link>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-ink"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-border p-2 text-muted lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
                {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle compact />
              {action && <div>{action}</div>}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
