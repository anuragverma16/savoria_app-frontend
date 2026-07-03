import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { buildOrderPanelPath } from '../utils/orderPanelPaths'

export function buildMenuQrPath(restaurantId, tableId) {
  if (!restaurantId || !tableId) return '/order/dashboard'
  return buildOrderPanelPath('menu', restaurantId, { tableId })
}

export function useCustomerPaths() {
  const location = useLocation()
  const session = loadSavoriaSession() || {}
  const isOrderPanel = location.pathname.startsWith('/order') || Boolean(session.qrLinked)

  return useMemo(() => {
    const menuForTable = (rid, tid) => buildOrderPanelPath(
      'menu',
      rid || session.rid,
      { tableId: tid || session.tableId, tableNumber: session.tableNumber, tableToken: session.tableToken },
    )

    if (isOrderPanel) {
      return {
        isOrderPanel: true,
        base: '/order',
        menu: menuForTable(session.rid, session.tableId),
        cart: '/order/cart',
        checkout: '/order/checkout',
        orders: '/order/history',
        activeOrders: '/order/active',
        orderDetails: (orderId) => `/order/orders/${orderId}`,
        profile: '/order/settings',
        dashboard: '/order/dashboard',
        orderSuccess: (orderId) => `/order/success/${orderId}`,
        menuForTable,
        tables: '/order/tables',
      }
    }

    return {
      isOrderPanel: false,
      base: '/order',
      menu: menuForTable(session.rid, session.tableId),
      cart: '/order/cart',
      checkout: '/order/checkout',
      orders: '/order/history',
      activeOrders: '/order/active',
      orderDetails: (orderId) => `/order/orders/${orderId}`,
      profile: '/order/settings',
      dashboard: '/order/dashboard',
      orderSuccess: (orderId) => `/order/success/${orderId}`,
      menuForTable,
      tables: '/order/dashboard',
    }
  }, [isOrderPanel, session.rid, session.tableId, session.tableNumber, session.tableToken])
}
