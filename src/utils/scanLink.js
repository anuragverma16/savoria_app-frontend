/**
 * QR URL format:
 * {origin}/order/menu?restaurantId={mongoId}&tableId={mongoId}&no={tableNumber}
 * Legacy: /scan?... still supported
 */

import { loadSavoriaSession } from './savoriaGuestSession'

export const SCAN_PATH = '/scan'
export const ORDER_MENU_PATH = '/order/menu'

const ORDER_PANEL_PREFIXES = [
  '/order/menu',
  '/order/cart',
  '/order/checkout',
  '/order/success',
  '/order/active',
  '/order/history',
  '/order/orders',
  '/order/settings',
  '/order/dashboard',
]

export function getAppOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return ''
}

export function buildTableMenuUrl(restaurantId, tableId, baseUrl, tableNumber) {
  const origin = (baseUrl || getAppOrigin() || 'http://localhost:3000').replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('restaurantId', String(restaurantId))
  params.set('tableId', String(tableId))
  if (tableNumber != null && tableNumber !== '') {
    params.set('no', String(tableNumber))
  }
  return `${origin}${ORDER_MENU_PATH}?${params.toString()}`
}

/** @deprecated use buildTableMenuUrl — kept for legacy /scan links */
export function buildTableScanUrl(restaurantId, tableId, baseUrl, tableNumber) {
  return buildTableMenuUrl(restaurantId, tableId, baseUrl, tableNumber)
}

export function buildTableMenuPath(restaurantId, tableId, tableNumber) {
  const params = new URLSearchParams()
  params.set('restaurantId', String(restaurantId))
  params.set('tableId', String(tableId))
  if (tableNumber != null && tableNumber !== '') {
    params.set('no', String(tableNumber))
  }
  return `${ORDER_MENU_PATH}?${params.toString()}`
}

/** @deprecated use buildTableMenuPath */
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
    const isMenuPath = /\/order\/menu\/?$/i.test(url.pathname)
    const slugTableMatch = url.pathname.match(/\/r\/([^/]+)\/t\/([^/?]+)/i)
    const restaurantId = url.searchParams.get('restaurantId')
      || url.searchParams.get('rid')
      || url.pathname.match(/\/restaurant\/([^/]+)\//i)?.[1]
      || url.pathname.match(/\/menu\/([^/]+)\//i)?.[1]
    const tableId = url.searchParams.get('tableId')
      || url.pathname.match(/\/menu\/[^/]+\/([^/?]+)/i)?.[1]
    const tableNumber = url.searchParams.get('no') || url.searchParams.get('tableNumber')

    if (isScanPath || isMenuPath || slugTableMatch || (restaurantId && tableId)) {
      return {
        restaurantId: restaurantId ? decodeURIComponent(restaurantId) : null,
        tableId: tableId ? decodeURIComponent(tableId) : null,
        tableNumber: tableNumber ? decodeURIComponent(tableNumber) : (slugTableMatch ? decodeURIComponent(slugTableMatch[2]) : null),
        slug: slugTableMatch ? decodeURIComponent(slugTableMatch[1]) : null,
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

/** Locked QR table session — customer browses as guest until payment signup */
export function isQrTableSession(session = loadSavoriaSession()) {
  return Boolean(session?.scanLocked && session?.qrLinked && session?.rid && session?.tableId)
}

/** True when user is in guest table-order flow (QR scan or linked session on /order/*). */
export function isGuestQrOrderFlow(searchParams, pathname = '') {
  if (pathname === '/order/scan' || pathname.startsWith('/order/scan/')) return true

  const onOrderPanel = ORDER_PANEL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  if (hasScanParams(searchParams)) return true

  if (onOrderPanel && isQrTableSession()) return true

  return false
}

/** Super admin may preview customer order UI only from an explicit table QR URL. */
export function isActiveSuperAdminQrPreview(searchParams, pathname = '') {
  return hasScanParams(searchParams) && isGuestQrOrderFlow(searchParams, pathname)
}
