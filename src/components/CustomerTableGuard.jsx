import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { hasQrTableSession } from '../utils/userTableSession'
import { useCustomerPaths } from '../hooks/useCustomerPaths'

/** Ensures customer has a QR-linked table before cart/checkout. */
export default function CustomerTableGuard({ children }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const paths = useCustomerPaths()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const session = loadSavoriaSession()

  const urlRestaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
  const urlTableId = searchParams.get('tableId')
  const urlHasTable = Boolean(urlRestaurantId && urlTableId)
  const rid = activeRestaurant?._id || session?.rid || urlRestaurantId

  if (rid && !urlHasTable && !hasQrTableSession(rid) && !session?.qrLinked) {
    return <Navigate to={paths.tables} replace state={{ from: location }} />
  }

  if (session?.scanLocked && session?.rid && rid && !urlHasTable && String(session.rid) !== String(rid)) {
    return <Navigate to="/invalid-qr" replace />
  }

  return children
}
