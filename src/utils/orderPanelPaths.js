import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { buildTableBookingParams } from './tableBookingLink'

/** Shared paths for /order (guest) vs /restaurant/:rid/user (member) panels */
export function useOrderPanelPaths() {
  const location = useLocation()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const rid = activeRestaurant?._id

  return useMemo(() => {
    const isOrderPanel = location.pathname.startsWith('/order')
    if (isOrderPanel) {
      return {
        isOrderPanel: true,
        rid,
        base: '/order',
        siteHome: '/',
        home: '/order/dashboard',
        tables: '/order/tables',
        menu: '/order/menu',
        history: '/order/dashboard',
      }
    }
    const base = rid ? `/restaurant/${rid}/user` : '/order/dashboard'
    return {
      isOrderPanel: false,
      rid,
      base,
      siteHome: '/',
      home: `${base}`,
      tables: `${base}/tables`,
      menu: `${base}/menu`,
      history: `${base}`,
    }
  }, [location.pathname, rid])
}

/** Menu auto-link for public order panel */
export function buildOrderMenuAutoLinkPath(restaurantId, params) {
  const p = params instanceof URLSearchParams
    ? new URLSearchParams(params)
    : buildTableBookingParams({
      restaurantId,
      tableToken: params?.tableToken || params?.table,
      tableId: params?.tableId,
      tableNumber: params?.tableNumber || params?.no,
    })
  p.set('qrLink', '1')
  return `/order/menu?${p.toString()}`
}
