/** Auth entry — always opens the home-page modal (no separate /sign-in page) */

import { normalizeLoginRole } from './panelRole'

export function resolveAuthGateState(pathname = '') {
  if (pathname.startsWith('/platform')) {
    return { path: '/', authRole: 'superadmin', redirectPath: '/platform' }
  }
  if (/^\/restaurant\/[^/]+\/user(\/|$)/.test(pathname)) {
    return { path: '/', authRole: 'user' }
  }
  if (/^\/restaurant\/[^/]+\/(staff|orders|kitchen|tables|menu-stock)(\/|$)/.test(pathname)) {
    return { path: '/', authRole: 'staff' }
  }
  if (/^\/restaurant\//.test(pathname)) {
    return { path: '/', authRole: 'admin' }
  }
  return { path: '/', authRole: 'user' }
}

export function resolveSignInPath(pathname = '') {
  return resolveAuthGateState(pathname).path
}

/** Navigate target: home + auth modal for the given panel role */
export function openSignInForRole(role = 'user', from) {
  const authRole = role === 'superadmin' ? 'superadmin' : normalizeLoginRole(role)
  const search = authRole && authRole !== 'user' ? `?role=${encodeURIComponent(authRole)}` : ''

  let redirectPath
  if (from?.pathname?.startsWith('/platform')) redirectPath = '/platform'
  else if (authRole === 'user') redirectPath = '/order/dashboard'
  else if (from?.pathname) redirectPath = `${from.pathname}${from.search || ''}`

  return {
    pathname: '/',
    search,
    state: {
      openAuth: true,
      authRole,
      from: from?.pathname ? from : undefined,
      redirectPath,
    },
  }
}

export function signInPathForRole(role) {
  if (role === 'superadmin') return '/sign-in?role=superadmin'
  if (!role || role === 'user') return '/sign-in?role=user'
  if (role === 'staff') return '/sign-in?role=staff'
  if (role === 'admin') return '/sign-in?role=admin'
  return '/sign-in'
}
