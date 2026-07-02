import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { hasQrTableSession } from '../utils/userTableSession'
import { useCustomerPaths } from '../hooks/useCustomerPaths'

/** Ensures customer has a QR-linked table before cart/checkout. */
export default function CustomerTableGuard({ children }) {
  const location = useLocation()
  const paths = useCustomerPaths()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const session = loadSavoriaSession()
  const rid = activeRestaurant?._id || session?.rid

  if (rid && !hasQrTableSession(rid) && !session?.qrLinked) {
    return <Navigate to={paths.tables} replace state={{ from: location }} />
  }

  if (session?.scanLocked && session?.rid && rid && String(session.rid) !== String(rid)) {
    return <Navigate to="/invalid-qr" replace />
  }

  return children
}
