import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { hasQrTableSession } from '../utils/userTableSession'
import { useOrderPanelQuery } from '../hooks/useOrderPanelQuery'

function hasTableSessionForRestaurant(session, restaurantId) {
  if (!restaurantId) return false
  if (hasQrTableSession(restaurantId)) return true
  return Boolean(
    session?.qrLinked
    && String(session.rid) === String(restaurantId)
    && session.tableId
    && session.tableToken,
  )
}

/**
 * Restricts guest order panel to the restaurant/table from QR scan.
 */
export default function ScannedRestaurantGuard({ children, requireTable = false }) {
  const location = useLocation()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const session = loadSavoriaSession()
  const { withQuery } = useOrderPanelQuery()
  const rid = session?.rid || activeRestaurant?._id

  if (requireTable && rid && !hasTableSessionForRestaurant(session, rid)) {
    return <Navigate to={withQuery('/order/dashboard')} replace state={{ from: location }} />
  }

  if (session?.scanLocked && session?.rid && rid && String(session.rid) !== String(rid)) {
    return <Navigate to="/invalid-qr" replace />
  }

  return children
}
