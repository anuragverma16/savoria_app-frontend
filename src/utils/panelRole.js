/** Client-facing panel: admin | staff | user | superadmin */

import { setActiveRestaurant, setImpersonating, setViewAsPanel, clearTenant } from '../store/slices/tenantSlice'
import { isActiveQrCustomerSession, resolveOrderDashboardPath } from './qrCustomerFlow'
import { loadSavoriaSession } from './savoriaGuestSession'
import { shouldOpenSuperAdminPanel } from './superAdminPhone'

export const RESTAURANT_SUSPENDED_MESSAGE = 'Restaurant suspended by super admin'

const STAFF_ROLES = ['staff', 'manager', 'waiter', 'chef', 'cashier', 'custom']

export function isPlatformProvisioned(membership) {
  if (!membership) return false
  if (membership.provisionedBy === 'platform') return true
  if (!membership.provisionedBy && membership.role === 'restaurant_admin') return true
  return false
}

export function canAccessAsAdmin(membership) {
  return membership?.role === 'restaurant_admin' && isPlatformProvisioned(membership)
}

export function canAccessAsStaff(membership) {
  return STAFF_ROLES.includes(membership?.role) && isPlatformProvisioned(membership)
}

export function restaurantIdOf(membership) {
  const r = membership?.restaurant
  return r?._id ? String(r._id) : r ? String(r) : null
}

export function normalizeRestaurant(restaurant) {
  if (!restaurant) return null
  if (typeof restaurant === 'object' && restaurant._id) return restaurant
  if (typeof restaurant === 'string') return { _id: restaurant }
  return null
}

export function activeRestaurantId(activeRestaurant) {
  if (!activeRestaurant) return null
  if (typeof activeRestaurant === 'string') return String(activeRestaurant)
  return activeRestaurant._id ? String(activeRestaurant._id) : null
}

export function isRestaurantSuspended(restaurant) {
  return restaurant?.status === 'suspended'
}

export function isSuperAdminUser(user) {
  return user?.platformRole === 'superadmin' || user?.role === 'superadmin'
}

export function resolveRestaurantForId({ memberships, user, activeRestaurant, restaurantId }) {
  const rid = String(restaurantId)
  const fromMembership = memberships?.find((m) => restaurantIdOf(m) === rid)?.restaurant
  const candidates = [
    normalizeRestaurant(fromMembership),
    normalizeRestaurant(activeRestaurant),
    normalizeRestaurant(user?.restaurant),
  ].filter(Boolean)
  return candidates.find((r) => String(r._id) === rid) || null
}

export function shouldBlockSuspendedRestaurant(user, restaurant, { impersonating } = {}) {
  if (!restaurant || !isRestaurantSuspended(restaurant)) return false
  if (isSuperAdminUser(user) && impersonating) return false
  return true
}

export function pickMembership(user, memberships = [], rawRole) {
  const active = (memberships || []).filter((m) => m.isActive !== false && restaurantIdOf(m))
  if (!active.length) return null

  const notSuspended = active.filter((m) => m.restaurant?.status !== 'suspended')
  const pool = notSuspended.length ? notSuspended : active

  if (rawRole === 'admin') {
    const admins = pool.filter((m) => canAccessAsAdmin(m))
    if (!admins.length) return null
    const owned = admins.filter((m) => {
      const createdBy = m.restaurant?.createdBy
      const uid = user?._id || user?.id
      return createdBy && uid && String(createdBy) === String(uid)
    })
    const pool = owned.length ? owned : admins
    return pool.sort((a, b) => new Date(b.restaurant?.createdAt || 0) - new Date(a.restaurant?.createdAt || 0))[0]
  }

  if (rawRole === 'staff') {
    return pool.find((m) => canAccessAsStaff(m)) || null
  }

  if (rawRole === 'user') {
    return pool.find((m) => m.role === 'customer') || null
  }

  return pool[0]
}

export function pickMembershipAtRestaurant(user, memberships = [], restaurantId, rawRole = 'user') {
  if (!restaurantId) return pickMembership(user, memberships, rawRole)
  const rid = String(restaurantId)
  const match = (memberships || []).find(
    (m) => m.isActive !== false && restaurantIdOf(m) === rid,
  )
  if (match) return match
  return pickMembership(user, memberships, rawRole)
}

export function resolveAuthRestaurant(user, memberships = [], loginRole, preferredRestaurantId) {
  const membership = preferredRestaurantId
    ? pickMembershipAtRestaurant(user, memberships, preferredRestaurantId, loginRole)
    : pickMembership(user, memberships, loginRole)
  const restaurant = normalizeRestaurant(membership?.restaurant || user?.restaurant)
  return { membership, restaurant }
}

export function hydrateTenantAfterAuth(dispatch, { user, memberships, loginRole, preferredRestaurantId }, tabRole) {
  if (isSuperAdminUser(user) && (loginRole === 'superadmin' || tabRole === 'superadmin')) {
    dispatch(setImpersonating(false))
    dispatch(setViewAsPanel(null))
    dispatch(clearTenant())
    return { membership: null, restaurant: null, role: 'superadmin' }
  }

  const role = tabRole || loginRole || user?.role || 'user'
  const { membership, restaurant } = resolveAuthRestaurant(
    user, memberships, role, preferredRestaurantId,
  )

  dispatch(setImpersonating(false))
  const panel = ['admin', 'staff', 'user'].includes(role) ? role : null
  if (!isSuperAdminUser(user) && panel) {
    dispatch(setViewAsPanel(panel))
  } else {
    dispatch(setViewAsPanel(null))
  }
  if (restaurant) {
    dispatch(setActiveRestaurant(restaurant))
  } else {
    dispatch(clearTenant())
  }

  return { membership, restaurant, role }
}

export function hasRestaurantAccess(user, memberships, restaurantId) {
  if (!restaurantId) return false
  if (user?.platformRole === 'superadmin' || user?.role === 'superadmin') return true
  if ((memberships || []).some(
    (m) => m.isActive !== false && restaurantIdOf(m) === String(restaurantId),
  )) return true
  const userRid = user?.restaurant?._id || user?.restaurant
  return userRid && String(userRid) === String(restaurantId)
}

/** Routes shared by admin + staff — panel comes from role / viewAsPanel, not URL alone */
const STAFF_SHARED_SEGMENTS = new Set(['orders', 'kitchen', 'tables'])

/** Admin-only route segments under /restaurant/:id/… */
const ADMIN_ONLY_SEGMENTS = new Set(['admin', 'menu', 'staff-team', 'coupons', 'analytics', 'settings'])

/** Staff-only route segments */
const STAFF_ONLY_SEGMENTS = new Set(['staff', 'menu-stock'])

export function panelFromPathname(pathname = '') {
  if (/\/user(\/|$)/.test(pathname)) return 'user'

  const match = pathname.match(/\/restaurant\/[^/]+\/([^/?]+)/)
  const segment = match?.[1]
  if (!segment) return null

  if (STAFF_ONLY_SEGMENTS.has(segment)) return 'staff'
  if (ADMIN_ONLY_SEGMENTS.has(segment)) return 'admin'
  if (STAFF_SHARED_SEGMENTS.has(segment)) return null

  return null
}

export function getEffectivePanel(user, { impersonating, viewAsPanel, pathname } = {}) {
  const fromUrl = pathname ? panelFromPathname(pathname) : null
  const isSuperAdmin = isSuperAdminUser(user)

  if (!isSuperAdmin) {
    if (user?.role === 'admin') return 'admin'
    if (user?.role === 'staff') return 'staff'
    if (user?.role === 'user') return 'user'
    if (viewAsPanel === 'admin' || viewAsPanel === 'staff' || viewAsPanel === 'user') {
      return viewAsPanel
    }
    return fromUrl || 'user'
  }

  if (impersonating) {
    if (fromUrl) return fromUrl
    return viewAsPanel || 'admin'
  }

  return viewAsPanel || 'admin'
}

export function getDefaultPath(restaurantId, panel) {
  const base = `/restaurant/${restaurantId}`
  if (panel === 'user') return `${base}/user`
  if (panel === 'staff') return `${base}/staff`
  return `${base}/admin`
}

export function getRedirectAfterLogin(user, membership) {
  if (user.platformRole === 'superadmin' || user.role === 'superadmin') return '/platform'
  const restaurant = membership?.restaurant || user?.restaurant
  const rid = restaurant?._id || restaurant
  if (!rid) return null
  if (user.role === 'user') return `/restaurant/${rid}/user`
  if (user.role === 'staff') return `/restaurant/${rid}/staff`
  return `/restaurant/${rid}/admin`
}

/** Navbar profile menu — dashboard destination by role */
export function getNavbarDashboardPath(user, memberships = [], phoneHint) {
  if (isActiveQrCustomerSession()) {
    return resolveOrderDashboardPath()
  }

  // Savoria guest / not signed in with JWT → customer order panel
  if (!user || !accessTokenRole(user)) {
    return resolveOrderDashboardPath()
  }

  if (isSuperAdminUser(user)) {
    return '/platform'
  }

  if (user.role === 'user') {
    return resolveOrderDashboardPath()
  }

  if (user.role === 'staff' || user.role === 'admin') {
    const membership = pickMembership(user, memberships, user.role)
    return getRedirectAfterLogin(user, membership) || resolveOrderDashboardPath()
  }

  return resolveOrderDashboardPath()
}

function accessTokenRole(user) {
  return user?.role || user?.platformRole
}

/** Profile menu copy + destination */
export function getProfileDashboardMeta(user, memberships = []) {
  const path = getNavbarDashboardPath(user, memberships, user?.phone)

  if (path.startsWith('/order')) {
    const session = loadSavoriaSession() || {}
    const atTable = Boolean(session.qrLinked || session.tableId)
    return {
      path,
      label: atTable ? 'Table dashboard' : 'My dashboard',
      hint: atTable
        ? `${session.restaurantName || 'Restaurant'} · Table ${session.tableNumber || '—'}`
        : 'Orders, menu & cart',
      requiresAuth: false,
    }
  }
  if (path.startsWith('/platform')) {
    return { path, label: 'Platform', hint: 'Super admin console', requiresAuth: true }
  }
  if (path.includes('/staff')) {
    return { path, label: 'Staff panel', hint: 'Orders & kitchen', requiresAuth: true }
  }
  if (path.includes('/admin')) {
    return { path, label: 'Admin panel', hint: 'Restaurant management', requiresAuth: true }
  }
  return { path, label: 'Dashboard', hint: '', requiresAuth: false }
}

/** Whether the dashboard route requires a JWT session (not savoria-only guest). */
export function dashboardPathRequiresAuth(path) {
  return path.startsWith('/platform') || path.startsWith('/restaurant/')
}

/** Profile menu / navbar — navigate to the correct dashboard with auth handling. */
export function navigateToProfileDashboard({
  navigate,
  dispatch,
  user,
  memberships,
  phoneHint,
  accessToken,
  openAuthModal,
}) {
  const path = getNavbarDashboardPath(user, memberships, phoneHint) || resolveOrderDashboardPath()

  if (path.startsWith('/order')) {
    const session = loadSavoriaSession() || {}
    if (session.rid && dispatch) {
      dispatch(setActiveRestaurant({
        _id: session.rid,
        name: session.restaurantName,
        slug: session.slug,
      }))
    }
    navigate(path)
    return
  }

  if (dashboardPathRequiresAuth(path) && (!accessToken || !user)) {
    openAuthModal?.({ mode: 'login', redirectPath: path })
    return
  }

  if (user && accessToken && path.startsWith('/restaurant/')) {
    const panelRole = user.role === 'staff' ? 'staff' : user.role === 'admin' ? 'admin' : 'user'
    hydrateTenantAfterAuth(dispatch, { user, memberships, loginRole: panelRole }, panelRole)
  }

  navigate(path)
}

function restaurantIdFromMemberships(user, memberships = []) {
  const activeMemberships = (memberships || []).filter((m) => m.isActive !== false)
  const membership = activeMemberships[0] || { restaurant: user?.restaurant }
  const r = membership?.restaurant || user?.restaurant
  if (!r) return null
  return r._id ? String(r._id) : String(r)
}

/** Personal account settings — editable profile for every role */
export function getNavbarSettingsPath(user, memberships = [], phoneHint) {
  if (shouldOpenSuperAdminPanel(user, phoneHint)) return '/platform/settings'
  if (!user) return '/order/settings'
  const rid = restaurantIdFromMemberships(user, memberships)
  if (rid) return `/restaurant/${rid}/account`
  return '/order/settings'
}

/** Super admin may preview admin/staff panels when those roles are provisioned */
const SA_PREVIEW_KEY = 'sa_provision_preview'

export function grantProvisionPreview(restaurantId, panel, ttlMs = 5 * 60 * 1000) {
  if (!restaurantId || !panel) return
  try {
    sessionStorage.setItem(SA_PREVIEW_KEY, JSON.stringify({
      restaurantId: String(restaurantId),
      panel,
      until: Date.now() + ttlMs,
    }))
  } catch { /* ignore */ }
}

export function getProvisionPreviewGrant(restaurantId) {
  if (!restaurantId) return null
  try {
    const raw = sessionStorage.getItem(SA_PREVIEW_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() > parsed.until) {
      sessionStorage.removeItem(SA_PREVIEW_KEY)
      return null
    }
    if (String(restaurantId) !== String(parsed.restaurantId)) return null
    return parsed.panel
  } catch {
    return null
  }
}

/** Super admin opens Admin/Staff panels when those roles exist; Customer is always available */
export function getSuperAdminPreviewPanels(restaurant) {
  const counts = restaurant?.userCounts || {}
  const hasAdmin = (counts.admins ?? 0) > 0
  const hasStaff = (counts.staff ?? 0) > 0
  const grant = restaurant?._id ? getProvisionPreviewGrant(restaurant._id) : null
  const panels = []
  if (hasAdmin || grant === 'admin') panels.push('admin')
  if (hasStaff || grant === 'staff') panels.push('staff')
  panels.push('user')
  return [...new Set(panels)]
}

export function isSuperAdminPreviewPanel(restaurant, panelId) {
  return getSuperAdminPreviewPanels(restaurant).includes(panelId)
}

export function getSuperAdminPreviewPath(restaurant, panelId = 'user') {
  const rid = restaurant?._id
  if (!rid) return '/platform'
  const allowed = getSuperAdminPreviewPanels(restaurant)
  const panel = allowed.includes(panelId) ? panelId : (allowed[0] || 'user')
  const base = `/restaurant/${rid}`
  if (panel === 'user') return `${base}/user`
  if (panel === 'staff') return `${base}/staff`
  return `${base}/admin`
}

/** Valid login tab roles for the unified sign-in page */
export const LOGIN_ROLES = ['admin', 'staff', 'user', 'superadmin']

export function normalizeLoginRole(role) {
  if (role === 'superadmin') return 'admin'
  return LOGIN_ROLES.includes(role) ? role : 'user'
}
