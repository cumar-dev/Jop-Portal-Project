import { Link, useLocation } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  Briefcase,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserCircle,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { getUnreadNotificationCount } from '../../api/notifications'
import { ThemeToggle } from '../ui/ThemeToggle'
import { clearSession, getStoredUser } from '../../lib/authStorage'
import { UserAvatar } from '../shared/UserAvatar'

const navItems = [
  { to: '/applicant/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/applicant/dashboard/jobs', label: 'Browse jobs', icon: Search },
  { to: '/applicant/dashboard/saved', label: 'Saved jobs', icon: Bookmark },
  { to: '/applicant/dashboard/applications', label: 'Job applications', icon: FileText },
  { to: '/applicant/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/applicant/dashboard/profile', label: 'Profile', icon: UserCircle },
]

interface ApplicantLayoutProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export function ApplicantLayout({ title, subtitle, action, children }: ApplicantLayoutProps) {
  const [user, setUser] = useState(getStoredUser)
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser())
    syncUser()
    window.addEventListener('user-profile-updated', syncUser)
    return () => window.removeEventListener('user-profile-updated', syncUser)
  }, [location.pathname])

  useEffect(() => {
    async function loadUnread() {
      try {
        setUnreadCount(await getUnreadNotificationCount())
      } catch {
        setUnreadCount(0)
      }
    }

    loadUnread()
    const onUpdate = () => loadUnread()
    window.addEventListener('notifications-updated', onUpdate)
    return () => window.removeEventListener('notifications-updated', onUpdate)
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

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-elevated transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Link to="/" className="inline-flex items-center gap-2.5 font-semibold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
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
              to === '/applicant/dashboard'
                ? location.pathname === '/applicant/dashboard'
                : location.pathname.startsWith(to)

            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'text-muted hover:bg-subtle hover:text-ink'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : ''}`} />
                <span className="flex-1">{label}</span>
                {to === '/applicant/dashboard/notifications' && unreadCount > 0 && (
                  <span className="min-w-[1.25rem] rounded-full bg-emerald-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            to="/applicant/dashboard/profile"
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
              <p className="truncate text-xs text-muted">Applicant</p>
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
              <Link
                to="/applicant/dashboard/notifications"
                className="relative inline-flex items-center justify-center rounded-xl border border-border bg-card p-2.5 text-muted transition hover:bg-subtle hover:text-ink"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              {action && <div>{action}</div>}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
