import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { initSavoriaSessionFromParams } from '../../utils/savoriaGuestSession'
import { orderMenuAfterScan } from '../../utils/orderPanelPaths'

/** QR entry at /order — open restaurant menu for restaurant + table params */
export default function SavoriaQrEntry() {
  const [searchParams] = useSearchParams()

  const restaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
  const tableId = searchParams.get('tableId')

  useEffect(() => {
    initSavoriaSessionFromParams(searchParams)
  }, [searchParams])

  if (restaurantId && tableId) {
    return (
      <Navigate
        to={orderMenuAfterScan(restaurantId, { _id: tableId, tableId })}
        replace
      />
    )
  }

  const qs = searchParams.toString()
  return <Navigate to={qs ? `/order/dashboard?${qs}` : '/order/dashboard'} replace />
}
