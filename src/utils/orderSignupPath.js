import { buildOrderQueryParams } from './orderPanelPaths'
import { loadSavoriaSession } from './savoriaGuestSession'

export function buildOrderSignupUrl(redirectPath = '/order/checkout', searchParams) {
  const session = loadSavoriaSession() || {}
  const rid = searchParams?.get?.('restaurantId')
    || searchParams?.get?.('rid')
    || session.rid
  const tableId = searchParams?.get?.('tableId') || session.tableId
  const tableNumber = searchParams?.get?.('no')
    || searchParams?.get?.('tableNumber')
    || session.tableNumber

  const qs = buildOrderQueryParams(rid, {
    tableId,
    tableToken: session.tableToken,
    tableNumber,
  })
  qs.set('redirect', redirectPath)
  return `/order/signup?${qs.toString()}`
}
