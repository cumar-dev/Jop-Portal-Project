import { normalizeNotifications } from '../lib/notification'
import type { AppNotification } from '../types/notification'
import { apiGet, apiPut } from './client'

export async function getNotifications(limit = 50): Promise<AppNotification[]> {
  const data = await apiGet<unknown[]>(`/api/notifications?limit=${limit}`)
  return normalizeNotifications(data)
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await apiGet<{ count: number }>('/api/notifications/unread-count')
  return typeof data.count === 'number' ? data.count : 0
}

export function markNotificationRead(id: string) {
  return apiPut<{ message: string }>(`/api/notifications/${id}/read`, {})
}

export function markAllNotificationsRead() {
  return apiPut<{ message: string }>('/api/notifications/read-all', {})
}
