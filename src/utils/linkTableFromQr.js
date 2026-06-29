import { restaurantAPI } from '../api/dineflow'
import { initCart } from '../store/slices/cartSlice'
import { saveUserTableSession, loadUserTableSession } from './userTableSession'

/** Validate + check-in table after QR scan (always 1 guest — no seat picker) */
export async function linkTableFromQr(dispatch, restaurant, { tableToken, tableId }, guest = {}) {
  if (!restaurant?._id || (!tableToken && !tableId)) {
    throw new Error('Missing restaurant or table QR data')
  }

  const rid = String(restaurant._id)
  const api = restaurantAPI(rid)
  const payload = {
    tableToken: tableToken || undefined,
    tableId: tableId || undefined,
    guestCount: 1,
  }

  let validatedTable = null
  try {
    const { data: validation } = await api.validateTableQr({
      tableToken: payload.tableToken,
      tableId: payload.tableId,
    })
    if (validation?.valid === false) {
      return {
        booked: false,
        available: false,
        message: validation?.message || 'Invalid Table QR Code',
        table: validation?.table || null,
      }
    }
    if (validation?.valid) validatedTable = validation.table
  } catch (e) {
    const status = e.response?.status
    if (status && status !== 404 && status !== 502 && status !== 503) {
      throw e
    }
  }

  const { data } = await api.checkInTable({
    tableToken: validatedTable?.qrToken || payload.tableToken,
    tableId: validatedTable?._id || payload.tableId,
    guestCount: payload.guestCount,
    qrLink: true,
  })

  if (!data.available) {
    return {
      booked: false,
      available: false,
      displayStatus: data.displayStatus,
      message: data.message || 'Table not available',
      table: data.table,
    }
  }

  const guestCount = 1
  const session = {
    restaurantId: rid,
    tableId: data.table?._id,
    tableToken: data.table?.qrToken || tableToken,
    table: data.table,
    guestCount,
    guestName: guest.guestName || '',
    guestPhone: guest.guestPhone || '',
    qrLinked: true,
    linkedAt: Date.now(),
    sessionExpiresAt: data.sessionExpiresAt || null,
  }

  saveUserTableSession(restaurant._id, session)
  dispatch(initCart({
    restaurantId: rid,
    tableToken: session.tableToken,
    table: data.table,
  }))

  return {
    booked: true,
    available: true,
    displayStatus: data.displayStatus,
    message: data.message,
    table: data.table,
    sessionExpiresAt: data.sessionExpiresAt || null,
  }
}

export async function bookTableByToken(dispatch, restaurant, tableToken, guest = {}) {
  return linkTableFromQr(dispatch, restaurant, { tableToken }, guest)
}

export async function bookSelectedTable(dispatch, restaurant, table, guest = {}) {
  if (!restaurant?._id || !table?._id) {
    throw new Error('Missing restaurant or table')
  }
  return linkTableFromQr(
    dispatch,
    restaurant,
    { tableToken: table.qrToken, tableId: table._id },
    guest,
  )
}

/** Re-sync Redux cart from saved QR session (fixes add-to-cart after refresh) */
export function syncCartFromTableSession(dispatch, restaurantId) {
  const session = loadUserTableSession(restaurantId)
  if (!session?.qrLinked || !session.tableToken) return false
  dispatch(initCart({
    restaurantId: String(restaurantId),
    tableToken: session.tableToken,
    table: session.table,
  }))
  return true
}
