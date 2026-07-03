import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  getRedirectAfterLogin,
  isSuperAdminUser,
  pickMembership,
} from '../utils/panelRole'

/** Guest QR order panel — customers only; staff/admin go to their restaurant panel */
export default function GuestOrderPanelGuard({ children }) {
  const { user, accessToken, memberships } = useSelector((s) => s.auth)

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
