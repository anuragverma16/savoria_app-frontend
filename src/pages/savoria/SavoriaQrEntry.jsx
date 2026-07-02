import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { initSavoriaSessionFromParams } from '../../utils/savoriaGuestSession'
import { buildMenuQrPath } from '../../hooks/useCustomerPaths'

/** QR entry — parses table params and opens menu when possible */
export default function SavoriaQrEntry() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    initSavoriaSessionFromParams(searchParams)
  }, [searchParams])

  const restaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
  const tableId = searchParams.get('tableId')
  const qs = searchParams.toString()

  if (restaurantId && tableId) {
    const menuPath = buildMenuQrPath(restaurantId, tableId)
    return <Navigate to={qs ? `${menuPath}?${qs}` : menuPath} replace />
  }

  return <Navigate to={qs ? `/order/dashboard?${qs}` : '/order/dashboard'} replace />
}
