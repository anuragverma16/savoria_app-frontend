import { hasQrTableSession, loadUserTableSession, isDineInSession } from './userTableSession'

/** Whether guest can add to cart / checkout (QR table session active) */
export function canOrderFromTable(restaurantId) {
  if (!restaurantId || !hasQrTableSession(restaurantId)) return false
  const session = loadUserTableSession(restaurantId)
  return isDineInSession(session?.tableToken)
}

export function getActiveTableFromSession(restaurantId) {
  const session = loadUserTableSession(restaurantId)
  if (!hasQrTableSession(restaurantId)) return null
  return session?.table || null
}
