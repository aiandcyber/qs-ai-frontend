// Bridges Auth0's getAccessTokenSilently into the fetch layer.
// Registered by TokenBridge inside Auth0Provider (AuthShell).

type TokenGetter = () => Promise<string>

let getter: TokenGetter | null = null

export function setAccessTokenGetter(fn: TokenGetter | null): void {
  getter = fn
}

/** Authorization header for API calls, or empty when auth is off / not logged in. */
export async function authHeaders(): Promise<Record<string, string>> {
  if (!getter) return {}
  try {
    const token = await getter()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}
