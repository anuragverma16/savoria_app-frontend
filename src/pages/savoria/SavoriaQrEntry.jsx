import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { initSavoriaSessionFromParams, loadSavoriaSession } from '../../utils/savoriaGuestSession'
import { orderMenuAfterScan } from '../../utils/orderPanelPaths'

/** QR entry at /order — open menu when restaurant + table params are present */
export default function SavoriaQrEntry() {
  const [searchParams] = useSearchParams()
  const session = loadSavoriaSession() || {}

  const restaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
  const tableId = searchParams.get('tableId')

  useEffect(() => {
    initSavoriaSessionFromParams(searchParams)
  }, [searchParams])

  if (restaurantId && tableId) {
    const tableMeta = {
      _id: tableId,
      tableId,
      tableNumber: searchParams.get('no') || searchParams.get('tableNumber'),
      tableToken: searchParams.get('table'),
    }
    return <Navigate to={orderMenuAfterScan(restaurantId, tableMeta)} replace />
  }

  if (session.scanLocked && session.rid && session.tableId) {
    return (
      <Navigate
        to={orderMenuAfterScan(session.rid, {
          tableId: session.tableId,
          tableNumber: session.tableNumber,
          tableToken: session.tableToken,
        })}
        replace
      />
    )
  }

  const qs = searchParams.toString()
  return <Navigate to={qs ? `/order/dashboard?${qs}` : '/order/dashboard'} replace />
}
