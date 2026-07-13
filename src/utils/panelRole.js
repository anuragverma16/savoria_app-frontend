/** Client-facing panel: admin | staff | user | superadmin */

import { setActiveRestaurant, setImpersonating, setViewAsPanel, clearTenant } from '../store/slices/tenantSlice'
import { setCredentials } from '../store/slices/authSlice'
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

/** Super admin by JWT fields or registered platform phone */
export function isAccountSuperAdmin(user, phoneHint) {
  return isSuperAdminUser(user) || shouldOpenSuperAdminPanel(user, phoneHint)
}

/** Normalize auth user so guards and routes treat super admins consistently */
export function normalizeProfileUser(user, phoneHint) {
  if (!user) return null
  if (!isAccountSuperAdmin(user, phoneHint)) return user
  return {
    ...user,
    role: 'superadmin',
    platformRole: 'superadmin',
  }
}

/** Profile menu — canonical account role for dashboard routing */
export function resolveProfileDashboardRole(user, phoneHint) {
  const profileUser = normalizeProfileUser(user, phoneHint)
  if (!profileUser) {
    return shouldOpenSuperAdminPanel(null, phoneHint) ? 'superadmin' : 'guest'
  }
  if (isAccountSuperAdmin(profileUser, phoneHint)) return 'superadmin'
  if (profileUser.role === 'staff') return 'staff'
  if (profileUser.role === 'admin') return 'admin'
  return 'user'
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
  if (user.role === 'user') return `/order/dashboard?restaurantId=${rid}`
  if (user.role === 'staff') return `/restaurant/${rid}/staff`
  return `/restaurant/${rid}/admin`
}

/** Navbar profile menu — dashboard destination by role */
export function getNavbarDashboardPath(user, memberships = [], phoneHint) {
  if (!user && !phoneHint) return '/order/dashboard'

  const accountRole = resolveProfileDashboardRole(user, phoneHint)

  if (accountRole === 'superadmin') return '/platform'
  if (accountRole === 'guest') return '/order/dashboard'

  const profileUser = normalizeProfileUser(user, phoneHint) || user

  if (accountRole === 'staff') {
    const membership = pickMembership(profileUser, memberships, 'staff')
    const path = getRedirectAfterLogin(profileUser, membership)
    if (path) return path
    const rid = activeRestaurantId(normalizeRestaurant(profileUser.restaurant))
    return rid ? getDefaultPath(rid, 'staff') : null
  }

  if (accountRole === 'admin') {
    const membership = pickMembership(profileUser, memberships, 'admin')
    const path = getRedirectAfterLogin(profileUser, membership)
    if (path) return path
    const rid = activeRestaurantId(normalizeRestaurant(profileUser.restaurant))
    return rid ? getDefaultPath(rid, 'admin') : null
  }

  const membership = pickMembership(profileUser, memberships, 'user')
  return getRedirectAfterLogin(profileUser, membership) || '/order/dashboard'
}

function loginRoleForDashboardPath(path, user, phoneHint) {
  const accountRole = resolveProfileDashboardRole(user, phoneHint)
  if (accountRole === 'superadmin') return 'superadmin'
  return 'user'
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
  refreshToken,
  openAuthModal,
}) {
  const profileUser = normalizeProfileUser(user, phoneHint)
  const accountRole = resolveProfileDashboardRole(user, phoneHint)
  const path = getNavbarDashboardPath(user, memberships, phoneHint) || '/order/dashboard'

  if (dashboardPathRequiresAuth(path) && (!accessToken || !user)) {
    openAuthModal?.({
      mode: 'login',
      redirectPath: path,
      loginRole: loginRoleForDashboardPath(path, user, phoneHint),
    })
    return
  }

  if (profileUser && accessToken) {
    const needsRoleSync = accountRole === 'superadmin'
      && (user.role !== 'superadmin' || user.platformRole !== 'superadmin')

    if (needsRoleSync) {
      dispatch(setCredentials({
        user: profileUser,
        accessToken,
        refreshToken,
        memberships,
      }))
    }

    if (accountRole === 'superadmin') {
      hydrateTenantAfterAuth(
        dispatch,
        { user: profileUser, memberships, loginRole: 'superadmin' },
        'superadmin',
      )
    } else if (path.startsWith('/restaurant/')) {
      const panelRole = panelFromPathname(path) || accountRole
      hydrateTenantAfterAuth(
        dispatch,
        { user: profileUser, memberships, loginRole: panelRole },
        panelRole,
      )
    }
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

export function getSuperAdminPreviewPath(restaurant, panelId = 'admin') {
  const rid = restaurant?._id
  if (!rid) return '/platform'
  const allowed = getSuperAdminPreviewPanels(restaurant)
  const panel = allowed.includes(panelId) ? panelId : (allowed[0] || 'admin')
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
