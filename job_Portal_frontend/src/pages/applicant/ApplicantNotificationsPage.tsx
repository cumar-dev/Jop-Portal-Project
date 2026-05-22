import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Briefcase, CheckCheck, FileText } from 'lucide-react'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications'
import { ApiError } from '../../api/client'
import { ApplicantLayout } from '../../components/applicant/ApplicantLayout'
import { EmptyState } from '../../components/employer/EmptyState'
import { ApplicationStatusBadge } from '../../components/shared/ApplicationStatusBadge'
import { Alert } from '../../components/ui/Alert'
import { notificationLabel } from '../../lib/notification'
import { formatDateTime } from '../../lib/format'
import type { AppNotification } from '../../types/notification'

export function ApplicantNotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await getNotifications())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleMarkRead(notification: AppNotification) {
    if (notification.isRead || !notification.id) return
    try {
      await markNotificationRead(notification.id)
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      )
      window.dispatchEvent(new Event('notifications-updated'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not mark notification as read')
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true)
    setError(null)
    try {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
      window.dispatchEvent(new Event('notifications-updated'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length

  return (
    <ApplicantLayout
      title="Notifications"
      subtitle="Application updates and new jobs that match your skills."
      action={
        unreadCount > 0 ? (
          <button
            type="button"
            disabled={markingAll}
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        ) : undefined
      }
    >
      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <p className="text-center text-sm text-muted">Loading notifications...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll be notified when employers update your applications or when new jobs match skills from your applications."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((notification) => {
            const Icon = notification.type === 'new_job_match' ? Briefcase : FileText
            const jobLink = notification.jobId
              ? `/applicant/dashboard/jobs/${notification.jobId}`
              : null

            return (
              <li key={notification.id}>
                <article
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                    notification.isRead
                      ? 'border-slate-200'
                      : 'border-emerald-200 ring-1 ring-emerald-500/10'
                  }`}
                >
                  <div className="flex gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        notification.type === 'new_job_match'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-sky-50 text-sky-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{notification.title}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          {notificationLabel(notification.type)}
                        </span>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted">{notification.message}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatDateTime(notification.createdAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {notification.type === 'application_update' && notification.status && (
                          <ApplicationStatusBadge status={notification.status} />
                        )}
                        {jobLink && (
                          <Link
                            to={jobLink}
                            onClick={() => handleMarkRead(notification)}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            View job
                          </Link>
                        )}
                        {notification.type === 'application_update' && (
                          <Link
                            to="/applicant/dashboard/applications"
                            onClick={() => handleMarkRead(notification)}
                            className="text-sm font-medium text-slate-600 hover:text-ink"
                          >
                            My applications
                          </Link>
                        )}
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(notification)}
                            className="text-sm font-medium text-slate-500 hover:text-ink"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </ApplicantLayout>
  )
}
