import { loadSavoriaSession } from './savoriaGuestSession'
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

/** Customer JWT in savoria session — used on /order routes so QR login persists across scans */
export function getIsolatedOrderCustomerAuth() {
  if (typeof window === 'undefined') return null
  if (!window.location.pathname.startsWith('/order')) return null

  const savoria = loadSavoriaSession()
  if (!savoria?.orderCustomerAuth || !savoria?.customerTokens?.accessToken) return null

  const panelAuth = getStoredPanelAuth()
  if (panelAuth?.accessToken && isPanelAccountUser(panelAuth.user)) {
    return {
      accessToken: savoria.customerTokens.accessToken,
      refreshToken: savoria.customerTokens.refreshToken,
      restaurantId: savoria.rid ? String(savoria.rid) : null,
    }
  }

  return {
    accessToken: savoria.customerTokens.accessToken,
    refreshToken: savoria.customerTokens.refreshToken,
    restaurantId: savoria.rid ? String(savoria.rid) : null,
  }
}

export function hasIsolatedOrderCustomerAuth() {
  return Boolean(getIsolatedOrderCustomerAuth())
}
