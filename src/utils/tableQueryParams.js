import {
  buildTableBookingParams,
  buildMenuAutoLinkPath,
  parseTableBookingLink,
} from './tableBookingLink'

export { buildMenuAutoLinkPath }

/** Build URL search params for linked table */
export function buildTableSearchParams({ tableToken, tableId, tableNumber } = {}) {
  const params = buildTableBookingParams({
    tableToken,
    tableId,
    tableNumber,
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function buildUserMenuPath(restaurantId, table) {
  if (!restaurantId || !table) return `/restaurant/${restaurantId}/user/menu`
  return `/restaurant/${restaurantId}/user/menu${buildTableSearchParams({
    tableToken: table.qrToken,
    tableId: table._id,
    tableNumber: table.tableNumber,
  })}`
}

export function buildUserTablesPath(restaurantId) {
  return `/restaurant/${restaurantId}/user/tables`
}

export function buildUserScanPath(restaurantId, table) {
  if (!restaurantId || !table) return buildUserTablesPath(restaurantId)
  return `${buildUserTablesPath(restaurantId)}${buildTableSearchParams({
    tableToken: table.qrToken,
    tableId: table._id,
    tableNumber: table.tableNumber,
  })}`
}

export function readTableParamsFromSearch(searchParams) {
  if (!searchParams) return null
  const get = typeof searchParams.get === 'function'
    ? (k) => searchParams.get(k)
    : (k) => searchParams[k]

  const parsed = parseTableBookingLink(`?${new URLSearchParams(
    Object.fromEntries(
      ['table', 'tableId', 'no', 'rid'].map((k) => [k, get(k)]).filter(([, v]) => v),
    ),
  ).toString()}`)

  if (!parsed?.tableToken && !parsed?.tableId) {
    const tableToken = get('table')
    const tableId = get('tableId')
    if (!tableToken && !tableId) return null
    return {
      tableToken: tableToken || null,
      tableId: tableId || null,
      tableNumber: get('no') || null,
      rid: get('rid') || null,
    }
  }

  return {
    tableToken: parsed.tableToken,
    tableId: parsed.tableId,
    tableNumber: parsed.tableNumber,
    rid: parsed.rid,
  }
}
