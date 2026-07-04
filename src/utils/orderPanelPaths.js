import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { buildTableBookingParams } from './tableBookingLink'

export function resolveTableNumber(tableOrParams = {}, fallback = null) {
  const n = tableOrParams?.tableNumber
    ?? tableOrParams?.no
    ?? tableOrParams?.table?.tableNumber
    ?? fallback
  return n != null && n !== '' ? String(n) : null
}

/** Query string for QR-scoped order panel URLs */
export function buildOrderQueryParams(restaurantId, tableOrParams = {}) {
  const p = tableOrParams instanceof URLSearchParams
    ? new URLSearchParams(tableOrParams)
    : buildTableBookingParams({
      restaurantId,
      tableToken: tableOrParams?.tableToken || tableOrParams?.qrToken,
      tableId: tableOrParams?._id || tableOrParams?.tableId,
      tableNumber: resolveTableNumber(tableOrParams),
    })
  if (restaurantId) p.set('restaurantId', String(restaurantId))
  const tableId = tableOrParams?._id || tableOrParams?.tableId
  if (tableId) p.set('tableId', String(tableId))
  const tableNumber = resolveTableNumber(tableOrParams instanceof URLSearchParams ? {
    no: tableOrParams.get('no'),
    tableNumber: tableOrParams.get('tableNumber'),
  } : tableOrParams)
  if (tableNumber) {
    p.set('no', tableNumber)
    p.set('tableNumber', tableNumber)
  }
  return p
}

export function buildOrderPanelPath(segment, restaurantId, tableOrParams) {
  const path = segment ? `/order/${String(segment).replace(/^\//, '')}` : '/order/dashboard'
  const qs = buildOrderQueryParams(restaurantId, tableOrParams).toString()
  return qs ? `${path}?${qs}` : path
}

/** After QR scan — open menu in the user order panel for this restaurant + table */
export function orderMenuAfterScan(restaurantId, table) {
  return buildOrderPanelPath('menu', restaurantId, table)
}

/** After QR scan — open full user panel home for this restaurant + table */
export function orderDashboardAfterScan(restaurantId, table) {
  return buildOrderPanelPath('dashboard', restaurantId, table)
}

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
        cart: '/order/cart',
        checkout: '/order/checkout',
        orders: '/order/orders',
        orderSuccess: (orderId) => `/order/success/${orderId}`,
        history: '/order/history',
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
