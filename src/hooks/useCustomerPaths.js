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
    const tableCtx = {
      tableId: session.tableId,
      tableNumber: session.tableNumber,
      tableToken: session.tableToken,
    }
    const panelPath = (segment) => buildOrderPanelPath(
      segment,
      session.rid,
      tableCtx,
    )
    const menuForTable = (rid, tid) => buildOrderPanelPath(
      'menu',
      rid || session.rid,
      { ...tableCtx, tableId: tid || session.tableId },
    )

    if (isOrderPanel) {
      return {
        isOrderPanel: true,
        base: '/order',
        menu: menuForTable(session.rid, session.tableId),
        cart: panelPath('cart'),
        checkout: panelPath('checkout'),
        orders: panelPath('history'),
        activeOrders: panelPath('active'),
        orderDetails: (orderId) => panelPath(`orders/${orderId}`),
        profile: panelPath('settings'),
        dashboard: panelPath('dashboard'),
        orderSuccess: (orderId) => panelPath(`success/${orderId}`),
        menuForTable,
        tables: panelPath('tables'),
      }
    }

    return {
      isOrderPanel: false,
      base: '/order',
      menu: menuForTable(session.rid, session.tableId),
      cart: panelPath('cart'),
      checkout: panelPath('checkout'),
      orders: panelPath('history'),
      activeOrders: panelPath('active'),
      orderDetails: (orderId) => panelPath(`orders/${orderId}`),
      profile: panelPath('settings'),
      dashboard: panelPath('dashboard'),
      orderSuccess: (orderId) => panelPath(`success/${orderId}`),
      menuForTable,
      tables: panelPath('dashboard'),
    }
  }, [isOrderPanel, session.rid, session.tableId, session.tableNumber, session.tableToken])
}
