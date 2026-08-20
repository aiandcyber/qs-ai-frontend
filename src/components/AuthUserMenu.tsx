import { useAuth0 } from '@auth0/auth0-react'

function initials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '??'
}

export function AuthUserMenu() {
  const { user, logout, loginWithRedirect, isAuthenticated, isLoading } = useAuth0()
  if (isLoading) return null

  if (!isAuthenticated) {
    return (
      <button type="button" className="btn login-btn" onClick={() => loginWithRedirect()}>
        Login
      </button>
    )
  }

  const label = user?.email ?? user?.name ?? 'Signed in'
  return (
    <div className="user-menu">
      <span className="avatar" title={label}>{initials(user?.name, user?.email)}</span>
      <button
        type="button"
        className="btn secondary logout-btn"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        Sign out
      </button>
    </div>
  )
}
