import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Briefcase,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react'
import { UserAvatar } from '../shared/UserAvatar'
import { ThemeToggle } from '../ui/ThemeToggle'
import { clearSession, getStoredUser } from '../../lib/authStorage'
import type { AuthUser } from '../../types/auth'

interface SiteHeaderProps {
  variant?: 'default' | 'transparent'
}

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
]

export function SiteHeader({ variant = 'default' }: SiteHeaderProps) {
  const [user, setUser] = useState(getStoredUser)
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isHome = location.pathname === '/'
  const isSolid = variant === 'default' || scrolled || (isHome && Boolean(user))

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser())
    syncUser()
    window.addEventListener('user-profile-updated', syncUser)
    return () => window.removeEventListener('user-profile-updated', syncUser)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!userMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  function handleLogout() {
    clearSession()
    window.location.href = '/sign-in'
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isSolid
            ? 'border-b border-border bg-card/95 shadow-sm backdrop-blur-lg'
            : 'border-b border-transparent bg-transparent dark:border-border/50 dark:bg-card/80'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
          {/* Logo */}
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-3"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition group-hover:shadow-brand-600/40">
              <Briefcase className="h-5 w-5" strokeWidth={2} />
              <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block text-[15px] font-semibold leading-tight tracking-tight text-ink">
                JobPortal
              </span>
              <span className="block text-[11px] font-medium text-muted">
                Careers, simplified
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          {isHome && (
            <nav
              className="absolute left-1/2 hidden -translate-x-1/2 md:flex"
              aria-label="Main"
            >
              <ul className="flex items-center gap-1 rounded-full border border-border bg-card/90 p-1 shadow-sm backdrop-blur-sm">
                {navLinks.map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-subtle hover:text-ink"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle compact />
            {user ? (
              <AuthenticatedActions
                user={user}
                menuOpen={userMenuOpen}
                onToggleMenu={() => setUserMenuOpen((v) => !v)}
                onLogout={handleLogout}
                menuRef={menuRef}
              />
            ) : (
              <GuestActions />
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-ink shadow-sm transition hover:bg-subtle md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile panel */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={handleLogout}
        showNav={isHome}
      />
    </>
  )
}

function GuestActions() {
  return (
    <>
      <Link
        to="/sign-in"
        className="rounded-xl px-4 py-2 text-sm font-medium text-ink transition hover:bg-subtle"
      >
        Sign in
      </Link>
      <Link
        to="/sign-up"
        className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-brand-600/30"
      >
        Get started
      </Link>
    </>
  )
}

interface AuthenticatedActionsProps {
  user: AuthUser
  menuOpen: boolean
  onToggleMenu: () => void
  onLogout: () => void
  menuRef: RefObject<HTMLDivElement | null>
}

function AuthenticatedActions({
  user,
  menuOpen,
  onToggleMenu,
  onLogout,
  menuRef,
}: AuthenticatedActionsProps) {
  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {user.role === 'Employer' && (
        <Link
          to="/employer/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      )}
      {user.role === 'Applicant' && (
        <Link
          to="/applicant/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-200/40 dark:bg-brand-100/30 dark:text-brand-300 dark:hover:bg-brand-100/40"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      )}

      <button
        type="button"
        onClick={onToggleMenu}
        className={`flex items-center gap-2 rounded-xl border py-1.5 pr-2 pl-1.5 transition ${
          menuOpen
            ? 'border-brand-200 bg-brand-50 ring-4 ring-brand-500/10'
            : 'border-border bg-card hover:border-brand-200 hover:bg-subtle'
        }`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <UserAvatar
          fullName={user.fullName}
          profileImageUrl={user.profileImageUrl}
          profileImageUrlStored={user.profileImageUrlStored}
          size="sm"
          rounded="lg"
        />
        <span className="hidden max-w-[120px] truncate text-left text-sm font-medium text-ink lg:block">
          {user.fullName.split(' ')[0]}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition ${menuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-xl shadow-slate-300/30"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-subtle px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {user.role}
            </span>
          </div>

          <div className="p-1.5">
            {user.role === 'Employer' && (
              <Link
                to="/employer/dashboard"
                role="menuitem"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-subtle"
                onClick={onToggleMenu}
              >
                <LayoutDashboard className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Employer dashboard
              </Link>
            )}
            {user.role === 'Applicant' && (
              <Link
                to="/applicant/dashboard"
                role="menuitem"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-subtle"
                onClick={onToggleMenu}
              >
                <LayoutDashboard className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Applicant dashboard
              </Link>
            )}
            <Link
              to="/"
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-subtle"
              onClick={onToggleMenu}
            >
              <UserRound className="h-4 w-4 text-muted" />
              Home
            </Link>
          </div>

          <div className="border-t border-border p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  user: AuthUser | null
  onLogout: () => void
  showNav: boolean
}

function MobileMenu({ open, onClose, user, onLogout, showNav }: MobileMenuProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="absolute top-16 right-0 left-0 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-card px-4 py-5 shadow-xl">
        {showNav && (
          <nav className="mb-5 border-b border-border pb-5" aria-label="Mobile">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
              Explore
            </p>
            <ul className="space-y-1">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={onClose}
                    className="block rounded-xl px-3 py-3 text-sm font-medium text-ink transition hover:bg-subtle"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-subtle p-3">
              <UserAvatar
                fullName={user.fullName}
                profileImageUrl={user.profileImageUrl}
                profileImageUrlStored={user.profileImageUrlStored}
                size="lg"
                rounded="xl"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{user.fullName}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            {user.role === 'Employer' && (
              <Link
                to="/employer/dashboard"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                Employer dashboard
              </Link>
            )}
            {user.role === 'Applicant' && (
              <Link
                to="/applicant/dashboard"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                Applicant dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              to="/sign-in"
              onClick={onClose}
              className="rounded-xl border border-border py-3 text-center text-sm font-semibold text-ink"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              onClick={onClose}
              className="rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white shadow-md shadow-brand-600/25"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

