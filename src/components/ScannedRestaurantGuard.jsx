import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { hasQrTableSession } from '../utils/userTableSession'

function hasTableSessionForRestaurant(session, restaurantId) {
  if (!restaurantId) return false
  if (hasQrTableSession(restaurantId)) return true
  return Boolean(
    session?.qrLinked
    && String(session.rid) === String(restaurantId)
    && session.tableId,
  )
}

/**
 * Restricts guest order panel to the restaurant/table from QR scan.
 * Also accepts restaurantId + tableId from the URL (fresh scan link)
 * so navigation from the dashboard is never silently blocked.
 */
export default function ScannedRestaurantGuard({ children, requireTable = false }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const session = loadSavoriaSession()

  const urlRestaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
  const urlTableId = searchParams.get('tableId')
  const rid = session?.rid || activeRestaurant?._id || urlRestaurantId

  // URL carries a valid scan target — OrderScanBootstrap will link it.
  const urlHasTable = Boolean(urlRestaurantId && urlTableId)

  if (requireTable && rid && !urlHasTable && !hasTableSessionForRestaurant(session, rid)) {
    return <Navigate to="/order/scan" replace state={{ from: location }} />
  }

  if (session?.scanLocked && session?.rid && rid && !urlHasTable && String(session.rid) !== String(rid)) {
    return <Navigate to="/invalid-qr" replace />
  }

  return children
}
