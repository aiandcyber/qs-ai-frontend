export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`
  return `${API_BASE}${path}`
}

// Auth0 (login is enforced only for the QS Agent). When these are unset, auth is
// off and the agent works without login.
export const AUTH0_DOMAIN = (import.meta.env.VITE_AUTH0_DOMAIN ?? '').trim()
export const AUTH0_CLIENT_ID = (import.meta.env.VITE_AUTH0_CLIENT_ID ?? '').trim()
export const AUTH0_AUDIENCE = (import.meta.env.VITE_AUTH0_AUDIENCE ?? '').trim()
export const AUTH_CONFIGURED = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID && AUTH0_AUDIENCE)
