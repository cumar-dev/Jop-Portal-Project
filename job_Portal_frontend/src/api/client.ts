import { getToken } from '../lib/authStorage'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5046'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  if (!text) return response.statusText || 'Something went wrong'

  try {
    const json = JSON.parse(text) as unknown
    if (typeof json === 'string') return json
    if (json && typeof json === 'object') {
      const obj = json as Record<string, unknown>
      if (typeof obj.message === 'string') return obj.message
      if (typeof obj.Message === 'string') return obj.Message
      if (typeof obj.title === 'string') return obj.title
      if (Array.isArray(obj.errors)) return obj.errors.join(', ')
    }
  } catch {
    return text
  }

  return text
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(),
  })
  return handleResponse<TResponse>(response)
}

export async function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<TResponse>(response)
}

export async function apiPut<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<TResponse>(response)
}

export async function apiDelete<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handleResponse<TResponse>(response)
}
