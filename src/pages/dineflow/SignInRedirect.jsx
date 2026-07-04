import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { normalizeLoginRole } from '../../utils/panelRole'

/** /sign-in and legacy /login → home with the old user login modal (Login / Sign up tabs) */
export default function SignInRedirect() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const roleQuery = searchParams.get('role')
  const requestedRole = roleQuery === 'superadmin' ? 'superadmin' : normalizeLoginRole(roleQuery || 'user')
  const from = location.state?.from
  // Old login UI for staff/admin/user; superadmin uses admin OTP gate when needed
  const authRole = requestedRole === 'superadmin' ? 'superadmin' : 'user'

  let redirectPath
  if (from?.pathname) {
    redirectPath = `${from.pathname}${from.search || ''}`
  } else if (requestedRole === 'superadmin') {
    redirectPath = '/platform'
  } else if (requestedRole === 'user') {
    redirectPath = '/order/dashboard'
  }

  const homeSearch = requestedRole === 'superadmin' ? '?role=superadmin' : ''

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
