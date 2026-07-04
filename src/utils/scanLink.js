/**
 * QR scan URL format:
 * {origin}/scan?restaurantId={mongoId}&tableId={mongoId}&no={tableNumber}
 */

export const SCAN_PATH = '/scan'

export function getAppOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return ''
}

export function buildTableScanUrl(restaurantId, tableId, baseUrl, tableNumber) {
  const origin = (baseUrl || getAppOrigin() || 'http://localhost:3000').replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('restaurantId', String(restaurantId))
  params.set('tableId', String(tableId))
  if (tableNumber != null && tableNumber !== '') {
    params.set('no', String(tableNumber))
  }
  return `${origin}${SCAN_PATH}?${params.toString()}`
}

export function buildTableScanPath(restaurantId, tableId, tableNumber) {
  const params = new URLSearchParams()
  params.set('restaurantId', String(restaurantId))
  params.set('tableId', String(tableId))
  if (tableNumber != null && tableNumber !== '') {
    params.set('no', String(tableNumber))
  }
  return `${SCAN_PATH}?${params.toString()}`
}

/** Parse /scan URLs and legacy aliases */
export function parseScanLink(input) {
  const raw = String(input || '').trim()
  if (!raw) return null

  try {
    const url = raw.startsWith('http') || raw.startsWith('/')
      ? new URL(raw, getAppOrigin() || 'http://localhost:3000')
      : new URL(raw.startsWith('?') ? `http://localhost${raw}` : `http://localhost/?${raw}`)

    const isScanPath = /\/scan\/?$/i.test(url.pathname)
    const restaurantId = url.searchParams.get('restaurantId')
      || url.searchParams.get('rid')
      || url.pathname.match(/\/restaurant\/([^/]+)\//i)?.[1]
    const tableId = url.searchParams.get('tableId')
    const tableNumber = url.searchParams.get('no') || url.searchParams.get('tableNumber')

    if (isScanPath || (restaurantId && tableId)) {
      return {
        restaurantId: restaurantId ? decodeURIComponent(restaurantId) : null,
        tableId: tableId ? decodeURIComponent(tableId) : null,
        tableNumber: tableNumber ? decodeURIComponent(tableNumber) : null,
      }
    }
  } catch {
    /* fall through */
  }

  const ridMatch = raw.match(/[?&](?:restaurantId|rid)=([^&\s]+)/i)
  const tableIdMatch = raw.match(/[?&]tableId=([^&\s]+)/i)
  if (ridMatch && tableIdMatch) {
    return {
      restaurantId: decodeURIComponent(ridMatch[1]),
      tableId: decodeURIComponent(tableIdMatch[1]),
    }
  }

  return null
}

export function hasScanParams(searchParams) {
  if (!searchParams) return false
  const restaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
  const tableId = searchParams.get('tableId')
  return Boolean(restaurantId && tableId)
}
