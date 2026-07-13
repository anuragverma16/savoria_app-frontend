import { publicAPI } from '../api/dineflow'
import { initCart } from '../store/slices/cartSlice'
import { setActiveRestaurant } from '../store/slices/tenantSlice'
import { saveUserTableSession } from './userTableSession'
import { patchSavoriaSession, loadSavoriaSession, restoreCustomerAuthIntoSession } from './savoriaGuestSession'
import { orderMenuAfterScan } from './orderPanelPaths'
import { buildMenuQrPath } from '../hooks/useCustomerPaths'

/** Link table after QR scan (restaurantId + tableId) */
export async function linkGuestTableScan(dispatch, { restaurant, table }) {
  if (!restaurant?._id || !table?._id) {
    throw new Error('Invalid scan data')
  }

  const rid = String(restaurant._id)
  const tableToken = table.qrToken || table.qr_token
  if (!tableToken) {
    throw new Error('Table QR token missing')
  }

  const session = {
    restaurantId: rid,
    tableId: table._id,
    tableToken,
    table: { ...table, qrToken: tableToken },
    guestCount: 1,
    qrLinked: true,
    linkedAt: Date.now(),
  }

  saveUserTableSession(rid, session)
  dispatch(setActiveRestaurant({
    _id: rid,
    name: restaurant.name,
    slug: restaurant.slug,
    settings: restaurant.settings,
    address: restaurant.address,
    logo: restaurant.logo,
    phone: restaurant.phone,
    email: restaurant.email,
    gstNumber: restaurant.gstNumber,
  }))
  dispatch(initCart({
    restaurantId: rid,
    tableToken: session.tableToken,
    table: session.table,
  }))

  patchSavoriaSession({
    rid,
    slug: restaurant.slug,
    restaurantName: restaurant.name,
    tableToken: session.tableToken,
    tableId: session.tableId,
    tableNumber: table.tableNumber != null ? String(table.tableNumber) : undefined,
    qrLinked: true,
    scanLocked: true,
  })

  restoreCustomerAuthIntoSession()

  return { booked: true, table: session.table, restaurant }
}

/** Link table via scan menu API (single call — works for direct /order/menu URLs) */
export async function bootstrapScanMenuLink(dispatch, restaurantId, tableId) {
  let data
  try {
    const res = await publicAPI.getScanMenu(restaurantId, tableId)
    data = res?.data
  } catch (err) {
    if (!err.response) {
      const netErr = new Error(err.message || 'Cannot reach server. Check your connection.')
      netErr.code = 'NETWORK_ERROR'
      throw netErr
    }
    const code = err.response?.data?.code
    const message = err.response?.data?.message
    if (code === 'INVALID_QR') {
      const e = new Error(message || 'Invalid QR Code')
      e.code = 'INVALID_QR'
      throw e
    }
    if (code === 'TABLE_NOT_FOUND') {
      const e = new Error(message || 'Table Not Found')
      e.code = 'TABLE_NOT_FOUND'
      throw e
    }
    if (err.response?.status === 403 || err.response?.status === 404) {
      return {
        booked: false,
        code: code || 'TABLE_UNAVAILABLE',
        message: message || 'Table is not available right now.',
        table: err.response?.data?.table,
        restaurant: err.response?.data?.restaurant,
      }
    }
    throw err
  }

  if (!data?.restaurant || !data?.table) {
    const err = new Error('Invalid server response.')
    err.code = 'INVALID_RESPONSE'
    throw err
  }

  return linkGuestTableScan(dispatch, {
    restaurant: data.restaurant,
    table: data.table,
  })
}

/** Validate scan via API and link table */
export async function validateAndLinkScan(dispatch, restaurantId, tableId) {
  let data
  try {
    const res = await publicAPI.validateScan(restaurantId, tableId)
    data = res?.data
  } catch (err) {
    if (!err.response) {
      const netErr = new Error(err.message || 'Cannot reach server. Check your connection.')
      netErr.code = 'NETWORK_ERROR'
      throw netErr
    }
    throw err
  }

  if (!data || typeof data !== 'object') {
    const err = new Error('Invalid server response. Redeploy frontend with API URL configured.')
    err.code = 'INVALID_RESPONSE'
    throw err
  }

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

  restoreCustomerAuthIntoSession()

  return { booked: true, table, restaurant: data.restaurant }
}

export function menuPathAfterTableLink(restaurantId, table, isOrderPanel = true) {
  if (isOrderPanel) {
    return orderMenuAfterScan(restaurantId, table)
  }
  return buildMenuQrPath(restaurantId, table._id)
}
