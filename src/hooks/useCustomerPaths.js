import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'

export function buildMenuQrPath(restaurantId, tableId) {
  if (!restaurantId || !tableId) return '/orders'
  return `/menu/${restaurantId}/${tableId}`
}

export function useCustomerPaths() {
  const location = useLocation()
  const session = loadSavoriaSession() || {}
  const isOrderPanel = location.pathname.startsWith('/order')

  return useMemo(() => {
    const menuForTable = (rid, tid) => buildMenuQrPath(rid || session.rid, tid || session.tableId)

    if (isOrderPanel) {
      return {
        isOrderPanel: true,
        base: '/order',
        menu: '/order/menu',
        cart: '/order/cart',
        checkout: '/order/checkout',
        orders: '/order/orders',
        dashboard: '/order/dashboard',
        orderSuccess: (orderId) => `/order/success/${orderId}`,
        menuForTable,
        tables: '/order/tables',
      }
    }

    const menu = session.rid && session.tableId
      ? menuForTable(session.rid, session.tableId)
      : '/orders'

    return {
      isOrderPanel: false,
      base: '',
      menu,
      cart: '/cart',
      checkout: '/checkout',
      orders: '/orders',
      dashboard: '/orders',
      orderSuccess: (orderId) => `/order-success/${orderId}`,
      menuForTable,
      tables: '/orders',
    }
  }, [isOrderPanel, session.rid, session.tableId])
}
