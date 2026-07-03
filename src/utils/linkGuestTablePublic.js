import { publicAPI } from '../api/dineflow'
import { initCart } from '../store/slices/cartSlice'
import { saveUserTableSession } from './userTableSession'
import { patchSavoriaSession } from './savoriaGuestSession'
import { orderDashboardAfterScan } from './orderPanelPaths'
import { buildMenuQrPath } from '../hooks/useCustomerPaths'

/** Link table after QR scan (restaurantId + tableId) */
export async function linkGuestTableScan(dispatch, { restaurant, table }) {
  if (!restaurant?._id || !table?._id) {
    throw new Error('Invalid scan data')
  }

  const rid = String(restaurant._id)
  const session = {
    restaurantId: rid,
    tableId: table._id,
    tableToken: table.qrToken,
    table,
    guestCount: 1,
    qrLinked: true,
    linkedAt: Date.now(),
  }

  saveUserTableSession(rid, session)
  dispatch(initCart({
    restaurantId: rid,
    tableToken: session.tableToken,
    table,
  }))

  patchSavoriaSession({
    rid,
    slug: restaurant.slug,
    restaurantName: restaurant.name,
    tableToken: session.tableToken,
    tableId: session.tableId,
    tableNumber: table.tableNumber,
    qrLinked: true,
    scanLocked: true,
  })

  return { booked: true, table, restaurant }
}

/** Validate scan via API and link table */
export async function validateAndLinkScan(dispatch, restaurantId, tableId) {
  const { data } = await publicAPI.validateScan(restaurantId, tableId)

  if (!data.success && data.code === 'INVALID_QR') {
    const err = new Error(data.message || 'Invalid QR Code')
    err.code = 'INVALID_QR'
    throw err
  }

  if (!data.success && data.code === 'TABLE_NOT_FOUND') {
    const err = new Error(data.message || 'Table Not Found')
    err.code = 'TABLE_NOT_FOUND'
    throw err
  }

  if (!data.available) {
    return {
      booked: false,
      code: data.code || 'TABLE_UNAVAILABLE',
      message: data.message || 'Table not available',
      table: data.table,
      restaurant: data.restaurant,
    }
  }

  return linkGuestTableScan(dispatch, {
    restaurant: data.restaurant,
    table: data.table,
  })
}

/** Guest table link via slug + qrToken (legacy QRs) */
export async function linkGuestTablePublic(dispatch, { slug, tableToken, tableId, restaurant }) {
  if (!slug || !tableToken) {
    throw new Error('Missing restaurant or table QR data')
  }

  const { data } = await publicAPI.validateTable(slug, tableToken)
  if (!data.available) {
    return {
      booked: false,
      message: data.message || 'Table not available',
      table: data.table,
    }
  }

  const table = data.table
  const rid = String(restaurant?._id || data.restaurant?._id)
  const session = {
    restaurantId: rid,
    tableId: table._id || tableId,
    tableToken: table.qrToken || tableToken,
    table,
    guestCount: 1,
    qrLinked: true,
    linkedAt: Date.now(),
  }

  saveUserTableSession(rid, session)
  dispatch(initCart({
    restaurantId: rid,
    tableToken: session.tableToken,
    table,
  }))

  patchSavoriaSession({
    rid,
    slug: data.restaurant?.slug || slug,
    restaurantName: data.restaurant?.name || restaurant?.name,
    tableToken: session.tableToken,
    tableId: session.tableId,
    tableNumber: table.tableNumber,
    qrLinked: true,
    scanLocked: true,
  })

  return { booked: true, table, restaurant: data.restaurant }
}

export function menuPathAfterTableLink(restaurantId, table, isOrderPanel = true) {
  if (isOrderPanel) {
    return orderDashboardAfterScan(restaurantId, table)
  }
  return buildMenuQrPath(restaurantId, table._id)
}
