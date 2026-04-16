const TOKEN_KEY = 'dm_admin_token'

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getApiBase(): string {
  return String(import.meta.env.VITE_TRACKING_URL || '/api').replace(/\/$/, '')
}

export function isAdminTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number }
    if (payload.exp == null) return true
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function isAdminTokenValid(): boolean {
  const token = getAdminToken()
  if (!token) return false
  return !isAdminTokenExpired(token)
}

export async function adminFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAdminToken()
  const headers = new Headers(init.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  })
}
