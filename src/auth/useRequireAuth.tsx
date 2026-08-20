import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { AUTH_CONFIGURED } from '../config'

type EnsureAuth = () => Promise<boolean>

const RequireAuthContext = createContext<EnsureAuth>(async () => true)

function RequireAuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  const ensureAuth = useCallback(async (): Promise<boolean> => {
    if (isLoading) return false
    if (isAuthenticated) return true
    await loginWithRedirect({
      appState: { returnTo: window.location.pathname + window.location.search },
    })
    return false
  }, [isAuthenticated, isLoading, loginWithRedirect])

  return (
    <RequireAuthContext.Provider value={ensureAuth}>{children}</RequireAuthContext.Provider>
  )
}

/** Supplies ensureAuth(): redirects to Auth0 when needed; no-op when auth is off. */
export function AuthActionProvider({ children }: { children: ReactNode }) {
  if (!AUTH_CONFIGURED) {
    return (
      <RequireAuthContext.Provider value={async () => true}>
        {children}
      </RequireAuthContext.Provider>
    )
  }
  return <RequireAuthProvider>{children}</RequireAuthProvider>
}

export function useRequireAuth(): EnsureAuth {
  return useContext(RequireAuthContext)
}
