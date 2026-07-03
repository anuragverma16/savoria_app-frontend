import toast from 'react-hot-toast'
import {
  getRedirectAfterLogin,
  hydrateTenantAfterAuth,
  RESTAURANT_SUSPENDED_MESSAGE,
  shouldBlockSuspendedRestaurant,
} from './panelRole'
import { shouldOpenSuperAdminPanel } from './superAdminPhone'
import { resetPageLocks } from './resetPageLocks'

const ORDER_DASHBOARD = '/order/dashboard'

function resolveReturnPath(from, user) {
  if (!from?.pathname) {
    return user?.role === 'user' ? ORDER_DASHBOARD : null
  }
  if (user?.role === 'user' && (
    /\/user\/(tables|scan|menu)/.test(from.pathname)
    || from.pathname === '/book-table'
    || from.pathname === '/scan-table'
    || from.pathname.startsWith('/order')
  )) {
    return `${from.pathname}${from.search || ''}`
  }
  return `${from.pathname}${from.search || ''}`
}

/** Post-OTP navigation for admin / staff / user panel sign-in */
export function navigateAfterPanelAuth({
  user,
  memberships,
  loginRole,
  from,
  dispatch,
  navigate,
  isSuperAdminFlag = false,
}) {
  const openPlatform = isSuperAdminFlag || shouldOpenSuperAdminPanel(user, user?.phone)
  if (openPlatform) {
    const superUser = {
      ...user,
      platformRole: 'superadmin',
      role: 'superadmin',
    }
    hydrateTenantAfterAuth(dispatch, { user: superUser, memberships, loginRole: 'superadmin' }, 'superadmin')
    resetPageLocks()
    navigate('/platform', { replace: true })
    return
  }

  const effectiveRole = loginRole || user?.role || 'user'
  const { membership, restaurant } = hydrateTenantAfterAuth(
    dispatch,
    { user, memberships, loginRole: effectiveRole },
    effectiveRole,
  )

  const targetRestaurant = restaurant || membership?.restaurant || user?.restaurant
  if (shouldBlockSuspendedRestaurant(user, targetRestaurant)) {
    toast.error(RESTAURANT_SUSPENDED_MESSAGE)
    navigate('/restaurant-suspended', {
      replace: true,
      state: { restaurantName: targetRestaurant?.name },
    })
    return
  }

  const returnPath = resolveReturnPath(from, { ...user, role: effectiveRole })
  const path = returnPath
    || getRedirectAfterLogin(
      { ...user, role: effectiveRole },
      membership || { restaurant: targetRestaurant },
    )
    || ORDER_DASHBOARD

  if (!path) {
    toast.error('Could not open your panel. Check your account role and restaurant access.')
    return
  }

  resetPageLocks()
  navigate(path, { replace: true })
}
