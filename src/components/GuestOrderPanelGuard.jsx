import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  getRedirectAfterLogin,
  isSuperAdminUser,
  pickMembership,
} from '../utils/panelRole'
import { isGuestQrOrderFlow, hasScanParams } from '../utils/scanLink'

/** Guest QR order panel — staff/admin use restaurant panel unless scanning a table QR */
export default function GuestOrderPanelGuard({ children }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user, accessToken, memberships } = useSelector((s) => s.auth)

  // Super admin stays on platform until they open a table QR link (?restaurantId=&tableId=)
  if (accessToken && user && isSuperAdminUser(user)) {
    if (hasScanParams(searchParams)) {
      return children
    }
    return <Navigate to="/platform" replace />
  }

  // Table QR ordering is customer-facing — never bounce staff/admin during active scan flow
  if (isGuestQrOrderFlow(searchParams, location.pathname)) {
    return children
  }

  if (!accessToken || !user) return children

  if (user.role === 'staff' || user.role === 'admin') {
    const membership = pickMembership(user, memberships, user.role)
    const path = getRedirectAfterLogin(user, membership)
    if (path) return <Navigate to={path} replace />
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
