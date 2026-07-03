import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { normalizeLoginRole } from '../../utils/panelRole'

/** /sign-in and legacy /login → home with the global auth modal (same UI as navbar Sign in) */
export default function SignInRedirect() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const role = normalizeLoginRole(searchParams.get('role') || 'user')
  const from = location.state?.from

  let redirectPath
  if (from?.pathname) {
    redirectPath = `${from.pathname}${from.search || ''}`
  } else if (role === 'superadmin' || searchParams.get('role') === 'superadmin') {
    redirectPath = '/platform'
  } else if (role === 'user') {
    redirectPath = '/order/dashboard'
  }

  return (
    <Navigate
      to="/"
      replace
      state={{
        openAuth: true,
        authRole: searchParams.get('role') === 'superadmin' ? 'superadmin' : role,
        from: from || (redirectPath === '/platform' ? { pathname: '/platform' } : undefined),
        redirectPath,
      }}
    />
  )
}
