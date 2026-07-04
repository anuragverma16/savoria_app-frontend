import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { normalizeLoginRole } from '../../utils/panelRole'

/** /sign-in and legacy /login → home with the global auth modal (same UI as navbar Sign in) */
export default function SignInRedirect() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const role = normalizeLoginRole(searchParams.get('role') || 'user')
  const from = location.state?.from
  const roleQuery = searchParams.get('role')
  const authRole = roleQuery === 'superadmin' ? 'superadmin' : role

  let redirectPath
  if (from?.pathname) {
    redirectPath = `${from.pathname}${from.search || ''}`
  } else if (authRole === 'superadmin') {
    redirectPath = '/platform'
  } else if (authRole === 'user') {
    redirectPath = '/order/dashboard'
  }

  const homeSearch = authRole && authRole !== 'user'
    ? `?role=${encodeURIComponent(authRole)}`
    : ''

  return (
    <Navigate
      to={{ pathname: '/', search: homeSearch }}
      replace
      state={{
        openAuth: true,
        authRole,
        from: from || (redirectPath === '/platform' ? { pathname: '/platform' } : undefined),
        redirectPath,
      }}
    />
  )
}
