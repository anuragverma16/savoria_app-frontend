/** Auth entry — always opens the home-page modal (no separate /sign-in page) */

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

export function signInPathForRole(role) {
  if (role === 'superadmin') return '/portal'
  if (!role || role === 'user') return '/sign-in?role=user'
  if (role === 'staff') return '/sign-in?role=staff'
  if (role === 'admin') return '/sign-in?role=admin'
  return '/sign-in'
}
