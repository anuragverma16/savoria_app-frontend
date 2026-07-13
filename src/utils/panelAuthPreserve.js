import { loadSavoriaSession, loadPersistedCustomerAuth } from './savoriaGuestSession'
import { isSuperAdminUser } from './panelRole'

/** Platform / restaurant panel accounts that must not be replaced by QR customer OTP */
export function isPanelAccountUser(user) {
  if (!user) return false
  if (isSuperAdminUser(user)) return true
  return user.role === 'admin' || user.role === 'staff'
}

export function getStoredPanelAuth() {
  try {
    const auth = JSON.parse(localStorage.getItem('dineflow_auth') || '{}')
    if (!auth.accessToken || !auth.user) return null
    return auth
  } catch {
    return null
  }
}

export function shouldPreservePanelAuthDuringQrOrder(panelAuth = getStoredPanelAuth()) {
  return Boolean(panelAuth?.accessToken && isPanelAccountUser(panelAuth.user))
}

/** Customer JWT for /order routes — savoria session or durable store */
export function getIsolatedOrderCustomerAuth() {
  if (typeof window === 'undefined') return null
  if (!window.location.pathname.startsWith('/order')) return null

  const savoria = loadSavoriaSession()
  const persisted = loadPersistedCustomerAuth()
  const tokens = savoria?.customerTokens?.accessToken
    ? savoria.customerTokens
    : persisted?.customerTokens
  const hasCustomerSession = Boolean(
    savoria?.orderCustomerAuth
    || savoria?.auth?.verified
    || persisted?.auth?.verified,
  )

  if (!hasCustomerSession || !tokens?.accessToken) return null

  const restaurantId = savoria?.rid
    ? String(savoria.rid)
    : (persisted?.restaurantId ? String(persisted.restaurantId) : null)

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    restaurantId,
  }
}

export function hasIsolatedOrderCustomerAuth() {
  return Boolean(getIsolatedOrderCustomerAuth())
}
