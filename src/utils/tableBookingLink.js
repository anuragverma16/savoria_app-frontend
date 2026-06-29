/**
 * Link-based table booking — canonical QR uses /scan?restaurantId=&tableId=
 */

import { buildTableScanUrl, buildTableScanPath, SCAN_PATH } from './scanLink'

export const TABLE_BOOK_PATH = SCAN_PATH

export function getAppOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return ''
}

export function buildTableBookingParams({
  restaurantId,
  slug,
  tableToken,
  tableId,
  tableNumber,
} = {}) {
  const params = new URLSearchParams()
  if (restaurantId) params.set('rid', String(restaurantId))
  if (slug) params.set('slug', String(slug))
  if (tableToken) params.set('table', String(tableToken))
  if (tableId) params.set('tableId', String(tableId))
  if (tableNumber != null && tableNumber !== '') params.set('no', String(tableNumber))
  return params
}

/** Full absolute URL — encode in QR codes (admin uses server qrTargetUrl) */
export function buildTableBookingUrl(restaurantId, table, baseUrl) {
  return buildTableScanUrl(restaurantId, table?._id || table?.tableId, baseUrl)
}

/** Relative path for in-app navigation */
export function buildTableBookingPath(restaurantId, table) {
  return buildTableScanPath(restaurantId, table?._id || table?.tableId)
}

/** After opening book link — menu auto-links table */
export function buildMenuAutoLinkPath(restaurantId, params) {
  const p = params instanceof URLSearchParams
    ? new URLSearchParams(params)
    : buildTableBookingParams({
      restaurantId,
      tableToken: params?.tableToken || params?.table,
      tableId: params?.tableId,
      tableNumber: params?.tableNumber || params?.no,
    })
  p.set('qrLink', '1')
  return `/restaurant/${restaurantId}/user/menu?${p.toString()}`
}

/** Parse book-table / scan-table URL or query string */
export function parseTableBookingLink(input) {
  const raw = String(input || '').trim()
  if (!raw) return null

  try {
    const url = raw.startsWith('http') || raw.startsWith('/')
      ? new URL(raw, getAppOrigin() || 'http://localhost:3000')
      : new URL(raw.startsWith('?') ? `http://localhost${raw}` : `http://localhost/?${raw}`)

    const isBookPath = /\/(book-table|scan-table|scan)\/?$/i.test(url.pathname)
    const restaurantId = url.searchParams.get('restaurantId') || url.searchParams.get('rid')
      || url.pathname.match(/\/restaurant\/([^/]+)\//i)?.[1]
      || null
    const tableToken = url.searchParams.get('table')
    const tableId = url.searchParams.get('tableId')
    const slug = url.searchParams.get('slug')

    if (isBookPath || restaurantId || tableToken || tableId) {
      return {
        rid: restaurantId,
        restaurantId,
        slug: slug ? decodeURIComponent(slug) : null,
        tableToken: tableToken ? decodeURIComponent(tableToken) : null,
        tableId: tableId ? decodeURIComponent(tableId) : null,
        tableNumber: url.searchParams.get('no') || null,
      }
    }
  } catch {
    /* fall through */
  }

  const tableMatch = raw.match(/[?&]table=([^&\s]+)/i)
  const idMatch = raw.match(/[?&]tableId=([^&\s]+)/i)
  const ridMatch = raw.match(/[?&]rid=([^&\s]+)/i)
  const slugMatch = raw.match(/[?&]slug=([^&\s]+)/i)
  const noMatch = raw.match(/[?&]no=([^&\s]+)/i)

  if (tableMatch || idMatch) {
    return {
      rid: ridMatch ? decodeURIComponent(ridMatch[1]) : null,
      slug: slugMatch ? decodeURIComponent(slugMatch[1]) : null,
      tableToken: tableMatch ? decodeURIComponent(tableMatch[1]) : null,
      tableId: idMatch ? decodeURIComponent(idMatch[1]) : null,
      tableNumber: noMatch ? decodeURIComponent(noMatch[1]) : null,
    }
  }

  if (/^[a-f0-9-]{36}$/i.test(raw)) {
    return { rid: null, tableToken: raw, tableId: null, tableNumber: null }
  }

  return null
}

/** Whether URL/query has table identity for auto-link (no seat picker) */
export function hasTableBookingParams(input) {
  if (!input) return false
  if (input instanceof URLSearchParams) {
    const parsed = parseTableBookingLink(`?${input.toString()}`)
    return Boolean(parsed?.tableToken || parsed?.tableId)
  }
  if (typeof input === 'object') {
    return Boolean(
      input.tableToken || input.table || input.tableId
      || (input.restaurantId && input.tableId),
    )
  }
  const parsed = parseTableBookingLink(input)
  return Boolean(
    parsed?.tableToken || parsed?.tableId
    || (parsed?.restaurantId && parsed?.tableId),
  )
}

/** Menu opened from /book-table with auto-link flag */
export function isPendingMenuAutoLink(searchParams) {
  if (!searchParams || searchParams.get('qrLink') !== '1') return false
  return hasTableBookingParams(searchParams)
}

export async function copyTableBookingLink(url) {
  const text = url || ''
  if (!text) throw new Error('No link to copy')
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}
