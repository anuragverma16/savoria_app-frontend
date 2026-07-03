import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { buildOrderQueryParams } from '../utils/orderPanelPaths'

/** Preserve restaurant + table QR params across /order panel navigation */
export function useOrderPanelQuery() {
  const [searchParams] = useSearchParams()
  const session = loadSavoriaSession() || {}

  const restaurantId = searchParams.get('restaurantId')
    || searchParams.get('rid')
    || session.rid
  const tableId = searchParams.get('tableId') || session.tableId

  const queryString = useMemo(() => {
    if (restaurantId && tableId) {
      return buildOrderQueryParams(restaurantId, {
        tableId,
        tableToken: session.tableToken,
        tableNumber: session.tableNumber,
      }).toString()
    }
    return searchParams.toString()
  }, [restaurantId, tableId, session.tableToken, session.tableNumber, searchParams])

  const withQuery = useCallback((path) => {
    if (!queryString) return path
    const [base, existing] = path.split('?')
    if (existing) return path
    return `${base}?${queryString}`
  }, [queryString])

  return { restaurantId, tableId, queryString, withQuery }
}
