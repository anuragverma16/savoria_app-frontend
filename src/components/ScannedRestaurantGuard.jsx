import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { hasQrTableSession } from '../utils/userTableSession'

/**
 * Restricts guest order panel to the restaurant/table from QR scan.
 */
export default function ScannedRestaurantGuard({ children, requireTable = false }) {
  const location = useLocation()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const session = loadSavoriaSession()
  const rid = activeRestaurant?._id || session?.rid

  if (requireTable && rid && !hasQrTableSession(rid)) {
    return <Navigate to="/order/tables?scan=1" replace state={{ from: location }} />
  }

  if (session?.scanLocked && session?.rid && rid && String(session.rid) !== String(rid)) {
    return <Navigate to="/invalid-qr" replace />
  }

  return children
}
