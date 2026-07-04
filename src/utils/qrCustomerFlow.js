import { loadSavoriaSession } from './savoriaGuestSession'
import { hasQrTableSession, loadUserTableSession } from './userTableSession'
import { buildOrderPanelPath } from './orderPanelPaths'

/**
 * True when the user is in a table QR ordering flow (scan → customer dashboard).
 * Staff/super-admin JWT on the same device must not override this.
 */
export function isActiveQrCustomerSession(searchParams) {
  const session = loadSavoriaSession() || {}
  const rid = session.rid
    || searchParams?.get?.('restaurantId')
    || searchParams?.get?.('rid')
  const tableId = session.tableId || searchParams?.get?.('tableId')

  if (session.scanLocked && rid && tableId) return true
  if (session.qrLinked && rid && (tableId || session.tableToken)) return true
  if (rid && tableId && searchParams?.get?.('tableId')) return true
  if (rid && hasQrTableSession(rid)) return true

  return false
}

/** Customer order panel home — preserves restaurant + table from QR scan */
export function resolveOrderDashboardPath() {
  const session = loadSavoriaSession() || {}
  const rid = session.rid
  if (!rid) return '/order/dashboard'

  const tableSession = loadUserTableSession(rid)
  const tableId = session.tableId || tableSession?.tableId
  if (!tableId && !session.tableToken && !tableSession?.tableToken) {
    return '/order/dashboard'
  }

  return buildOrderPanelPath('dashboard', rid, {
    tableId,
    tableToken: session.tableToken || tableSession?.tableToken,
    tableNumber: session.tableNumber || tableSession?.table?.tableNumber,
  })
}
