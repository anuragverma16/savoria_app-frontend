import { Navigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  getRedirectAfterLogin,
  isSuperAdminUser,
  pickMembership,
} from '../utils/panelRole'
import { isActiveQrCustomerSession } from '../utils/qrCustomerFlow'

/**
 * Guest QR order panel — customers ordering at a table.
 * QR scan always opens this panel (menu + dashboard), even if staff/super-admin is logged in.
 */
export default function GuestOrderPanelGuard({ children }) {
  const [searchParams] = useSearchParams()
  const { user, accessToken, memberships } = useSelector((s) => s.auth)

  if (isActiveQrCustomerSession(searchParams)) {
    return children
  }

  if (!accessToken || !user) return children

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
