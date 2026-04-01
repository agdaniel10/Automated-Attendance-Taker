import type { StoredAdminSession } from '../types/dashboard'

const STORAGE_KEY = 'aagc-admin-session'

export function getDefaultBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL
  return typeof envBaseUrl === 'string' && envBaseUrl.trim()
    ? envBaseUrl.trim()
    : 'http://localhost:5000'
}

export function loadStoredAdminSession(): StoredAdminSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredAdminSession>
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.operatorName !== 'string' ||
      typeof parsed.expiresIn !== 'string' ||
      typeof parsed.baseUrl !== 'string'
    ) {
      return null
    }

    return {
      token: parsed.token,
      operatorName: parsed.operatorName,
      expiresIn: parsed.expiresIn,
      baseUrl: parsed.baseUrl,
    }
  } catch {
    return null
  }
}

export function saveStoredAdminSession(session: StoredAdminSession): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredAdminSession(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(STORAGE_KEY)
}
