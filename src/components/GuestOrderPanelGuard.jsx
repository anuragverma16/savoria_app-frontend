import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  getRedirectAfterLogin,
  isSuperAdminUser,
  pickMembership,
} from '../utils/panelRole'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'

function isActiveGuestScan(searchParams) {
  const rid = searchParams.get('restaurantId') || searchParams.get('rid')
  const tableId = searchParams.get('tableId')
  if (rid && tableId) return true
  const session = loadSavoriaSession()
  return Boolean(session?.qrLinked && session?.rid && session?.tableId)
}

/** Guest QR order panel — customers only; staff/admin may browse when scanning a table QR */
export default function GuestOrderPanelGuard({ children }) {
  const { user, accessToken, memberships } = useSelector((s) => s.auth)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  if (!accessToken || !user) return children

  const guestScan = location.pathname.startsWith('/order') && isActiveGuestScan(searchParams)

  if (guestScan && (user.role === 'staff' || user.role === 'admin')) {
    return children
  }

  if (isSuperAdminUser(user)) {
    return <Navigate to="/platform" replace />
  }

  if (user.role === 'staff' || user.role === 'admin') {
    const membership = pickMembership(user, memberships, user.role)
    const path = getRedirectAfterLogin(user, membership)
    if (path) return <Navigate to={path} replace />
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
