import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from '../types/auth'
import { apiPost } from './client'

export function login(payload: LoginPayload) {
  return apiPost<LoginResponse>('/api/auth/login', payload)
}

export function register(payload: RegisterPayload) {
  return apiPost<RegisterResponse>('/api/auth/register', payload)
}
