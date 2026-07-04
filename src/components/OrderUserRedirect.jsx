import { Navigate, useParams } from 'react-router-dom'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { buildOrderQueryParams } from '../utils/orderPanelPaths'

/** Redirect legacy /restaurant/:rid/user/* routes to the public order panel */
export default function OrderUserRedirect({ segment = 'dashboard' }) {
  const { restaurantId } = useParams()
  const session = loadSavoriaSession() || {}

  const qs = buildOrderQueryParams(restaurantId, {
    tableId: session.tableId,
    tableToken: session.tableToken,
    tableNumber: session.tableNumber || session.table?.tableNumber,
  }).toString()

  const paths = {
    dashboard: '/order/dashboard',
    menu: '/order/menu',
    tables: '/order/tables',
    scan: '/order/scan',
  }

  const target = paths[segment] || paths.dashboard
  return <Navigate to={qs ? `${target}?${qs}` : target} replace />
}
