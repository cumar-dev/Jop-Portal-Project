import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { getStoredUser } from '../lib/authStorage'
import type { AuthUser, UserRole } from '../types/auth'

const stats = [
  { value: '2,400+', label: 'Active listings' },
  { value: '850+', label: 'Partner companies' },
  { value: '98%', label: 'Satisfaction rate' },
]

interface FeatureItem {
  icon: LucideIcon
  title: string
  text: string
}

interface StepItem {
  step: string
  title: string
  text: string
}

const guestFeatures: FeatureItem[] = [
  {
    icon: Search,
    title: 'Smart job discovery',
    text: 'Find roles that match your skills, location, and career goals in one place.',
  },
  {
    icon: Shield,
    title: 'Trusted employers',
    text: 'Every company profile is structured for transparency before you apply.',
  },
  {
    icon: Zap,
    title: 'Apply in minutes',
    text: 'Upload your CV once and submit applications without repetitive forms.',
  },
  {
    icon: TrendingUp,
    title: 'Hire with confidence',
    text: 'Employers review applicants, track pipelines, and manage postings easily.',
  },
]

const applicantFeatures: FeatureItem[] = [
  {
    icon: Search,
    title: 'Browse open roles',
    text: 'Search listings, filter by location, and open full job details before you apply.',
  },
  {
    icon: Zap,
    title: 'Quick applications',
    text: 'Upload your CV to Cloudinary once and reuse it across every application.',
  },
  {
    icon: FileText,
    title: 'Application tracking',
    text: 'See every job you applied to, your status, and update applications anytime.',
  },
  {
    icon: Sparkles,
    title: 'Alerts & saved jobs',
    text: 'Get notified when status changes or new roles match your skills. Bookmark favorites.',
  },
]

const employerFeatures: FeatureItem[] = [
  {
    icon: Building2,
    title: 'Post job listings',
    text: 'Create roles with cover images, requirements, and company details in minutes.',
  },
  {
    icon: FileText,
    title: 'Applicant pipeline',
    text: 'Review CVs, filter by status, and move candidates through your hiring workflow.',
  },
  {
    icon: Users,
    title: 'Dashboard overview',
    text: 'Track active jobs, recent applications, and hiring activity from one place.',
  },
  {
    icon: Shield,
    title: 'Secure file storage',
    text: 'CVs and images are stored on Cloudinary with safe delivery links for your team.',
  },
]

const guestSteps: StepItem[] = [
  { step: '01', title: 'Create your profile', text: 'Sign up as a job seeker or employer in under a minute.' },
  { step: '02', title: 'Explore or publish', text: 'Browse openings or post roles tailored to your team.' },
  { step: '03', title: 'Connect & grow', text: 'Apply, review candidates, and move careers forward.' },
]

const applicantSteps: StepItem[] = [
  { step: '01', title: 'Complete your profile', text: 'Add your photo, CV, and details so employers recognize you.' },
  { step: '02', title: 'Find & apply', text: 'Browse jobs, save favorites, and submit applications with one flow.' },
  { step: '03', title: 'Track progress', text: 'Follow status updates and notifications as employers review you.' },
]

const employerSteps: StepItem[] = [
  { step: '01', title: 'Set up your account', text: 'Sign in as an employer and open your dashboard overview.' },
  { step: '02', title: 'Publish jobs', text: 'Post listings with cover images and start receiving applications.' },
  { step: '03', title: 'Review & decide', text: 'Open CVs, update applicant status, and manage your pipeline.' },
]

export function HomePage() {
  const user = getStoredUser()

  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader variant="transparent" />

      {user ? <LoggedInHome user={user} /> : <GuestHome />}

      <SiteFooter />
    </div>
  )
}

function GuestHome() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-600/15" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--color-border)_35%,transparent)_1px,transparent_0)] bg-size-[24px_24px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-200/40 dark:bg-brand-100/30 dark:text-brand-500">
                <Sparkles className="h-3.5 w-3.5" />
                Your next chapter starts here
              </span>

              <h1 className="mt-6 font-display text-5xl leading-[1.1] text-ink sm:text-6xl lg:text-[3.5rem]">
                Find work you love.
                <br />
                <em className="text-brand-600 not-italic dark:text-brand-500">Hire people who care.</em>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                JobPortal brings job seekers and employers together on a clean, professional
                platform — built for clarity, speed, and real career outcomes.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/sign-up"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 dark:shadow-brand-600/20"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/sign-in"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-subtle"
                >
                  Sign in
                </Link>
              </div>

              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-500" />
                  No credit card required
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-500" />
                  Applicant & employer roles
                </li>
              </ul>
            </div>

            <HeroJobCards />
          </div>

          <div className="mt-20 grid grid-cols-3 gap-6 rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm sm:gap-8 sm:p-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center sm:text-left">
                <p className="font-display text-3xl text-ink sm:text-4xl">{value}</p>
                <p className="mt-1 text-xs text-muted sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeFeaturesSection role={null} />
      <HomeHowItWorksSection role={null} />

      <CtaBand />
    </>
  )
}

function LoggedInHome({ user }: { user: AuthUser }) {
  const firstName = user.fullName.split(' ')[0]
  const actions = getRoleActions(user.role)
  const isEmployer = user.role === 'Employer'
  const dashboardHref = isEmployer ? '/employer/dashboard' : '/applicant/dashboard'
  const dashboardLabel = isEmployer ? 'Open employer dashboard' : 'Open applicant dashboard'

  return (
    <>
      <section className="home-hero relative overflow-hidden border-b border-brand-700/30 dark:border-brand-500/20">
        <div className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-white/25 blur-3xl dark:bg-brand-500/20" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-brand-200/20 blur-3xl dark:bg-brand-600/10" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <p className="text-sm font-medium uppercase tracking-wider text-white/70">
            Welcome back
          </p>
          <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">
            Good to see you, {firstName}.
          </h1>
          <p className="mt-4 max-w-xl text-white/85">
            You&apos;re signed in as a{' '}
            <span className="font-semibold text-white">{user.role}</span>.
            {isEmployer
              ? ' Head to your dashboard to manage jobs and review applicants.'
              : ' Browse open roles and track your applications from your dashboard.'}
          </p>
          <p className="mt-2 text-sm text-white/70">{user.email}</p>
          <Link
            to={dashboardHref}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-card px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50 dark:border-brand-500/30 dark:bg-card dark:text-brand-300 dark:hover:bg-brand-100/20"
          >
            {dashboardLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-surface py-12 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="-mt-10 grid gap-4 sm:grid-cols-3">
            {actions.map(({ icon: Icon, title, text, badge, href }) => {
              const cardClass =
                'app-panel block p-6 transition hover:border-brand-200 hover:shadow-md dark:hover:border-brand-500/40 dark:hover:shadow-lg dark:hover:shadow-black/25'

              const card = (
                <>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-100/30 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink">{title}</h3>
                    {badge && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted">{text}</p>
                </>
              )

              if (href) {
                return (
                  <Link key={title} to={href} className={cardClass}>
                    {card}
                  </Link>
                )
              }

              return (
                <div key={title} className={cardClass}>
                  {card}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <HomeFeaturesSection role={user.role} />
      <HomeHowItWorksSection role={user.role} />
    </>
  )
}

function HomeFeaturesSection({ role }: { role: UserRole | null }) {
  const items =
    role === 'Employer'
      ? employerFeatures
      : role === 'Applicant'
        ? applicantFeatures
        : guestFeatures

  const heading =
    role === 'Employer'
      ? 'Tools built for hiring teams'
      : role === 'Applicant'
        ? 'Everything you need as a job seeker'
        : 'Everything you need to hire and get hired'

  const subtext =
    role === 'Employer'
      ? 'Post roles, review CVs, and manage applicants from a single employer dashboard.'
      : role === 'Applicant'
        ? 'Discover jobs, apply faster, and stay on top of every application in one place.'
        : 'A focused experience without clutter — designed for professionals who expect polish at every step.'

  return (
    <section id="features" className="scroll-mt-24 border-t border-border bg-card py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-500">
            Features
          </p>
          <h2 className="mt-3 font-display text-4xl text-ink">{heading}</h2>
          <p className="mt-4 text-lg text-muted">{subtext}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="group rounded-2xl border border-border bg-subtle/80 p-8 transition hover:border-brand-200 hover:bg-brand-50/40 hover:shadow-lg hover:shadow-brand-600/5 dark:hover:border-brand-500/40 dark:hover:bg-brand-100/20"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/20 transition group-hover:scale-105">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HomeHowItWorksSection({ role }: { role: UserRole | null }) {
  const items =
    role === 'Employer'
      ? employerSteps
      : role === 'Applicant'
        ? applicantSteps
        : guestSteps

  const subtitle =
    role === 'Employer'
      ? 'Your hiring workflow in three steps'
      : role === 'Applicant'
        ? 'Land your next role in three steps'
        : 'Three steps to success'

  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-border bg-surface py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-500">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl text-ink">{subtitle}</h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {items.map(({ step, title, text }) => (
            <div
              key={step}
              className="relative rounded-2xl border border-border bg-card p-8 shadow-sm"
            >
              <span className="font-display text-5xl text-brand-100 dark:text-brand-200/30">
                {step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface RoleActionItem {
  icon: LucideIcon
  title: string
  text: string
  badge?: boolean
  href?: string
}

function getRoleActions(role: UserRole): RoleActionItem[] {
  if (role === 'Employer') {
    return [
      {
        icon: Building2,
        title: 'Post a job',
        text: 'Create listings and reach qualified candidates.',
        href: '/employer/dashboard/jobs',
      },
      {
        icon: FileText,
        title: 'Review applications',
        text: 'See who applied and open their CVs.',
        href: '/employer/dashboard/applications',
      },
      {
        icon: Users,
        title: 'Dashboard overview',
        text: 'Stats and recent activity at a glance.',
        href: '/employer/dashboard',
      },
    ]
  }

  return [
    {
      icon: Search,
      title: 'Browse jobs',
      text: 'Explore openings and apply with your CV.',
      href: '/applicant/dashboard/jobs',
    },
    {
      icon: FileText,
      title: 'My applications',
      text: 'Track where you applied and view your CVs.',
      href: '/applicant/dashboard/applications',
    },
    {
      icon: Sparkles,
      title: 'Dashboard overview',
      text: 'See open roles and recent activity.',
      href: '/applicant/dashboard',
    },
  ]
}

function HeroJobCards() {
  const cards = [
    {
      title: 'Senior Product Designer',
      company: 'Northwind Labs',
      location: 'Remote · Full-time',
      tag: 'Featured',
      salary: '$95k – $120k',
    },
    {
      title: 'Backend Engineer',
      company: 'Atlas Systems',
      location: 'Nairobi · Hybrid',
      tag: 'New',
      salary: '$80k – $105k',
    },
  ]

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-4 rounded-3xl bg-linear-to-br from-brand-500/20 to-brand-700/10 blur-2xl dark:from-brand-500/15 dark:to-brand-700/5" />
      <div className="relative space-y-4">
        {cards.map((job, i) => (
          <article
            key={job.title}
            className={`rounded-2xl border border-border bg-card p-5 shadow-xl shadow-slate-300/30 dark:shadow-black/40 ${
              i === 1 ? 'ml-6 lg:ml-12' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-100/40 dark:text-brand-500">
                  {job.tag}
                </span>
                <h3 className="mt-2 font-semibold text-ink">{job.title}</h3>
                <p className="text-sm text-muted">{job.company}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {job.salary}
              </span>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

function CtaBand() {
  return (
    <section className="mx-6 mb-24 max-w-6xl lg:mx-auto">
      <div className="home-hero overflow-hidden rounded-3xl px-8 py-14 text-center sm:px-16">
        <h2 className="font-display text-3xl text-white sm:text-4xl">
          Ready to move your career forward?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/85">
          Join thousands of professionals and hiring teams who use JobPortal to connect
          with purpose.
        </p>
        <Link
          to="/sign-up"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-card px-6 py-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-300 dark:hover:bg-brand-100/20"
        >
          Create free account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
