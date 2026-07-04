import { parseTableBookingLink } from './tableBookingLink'
import { parseScanLink } from './scanLink'

/** Parse scanned QR text or URL params into table link info */
export function parseTableQr(scannedText) {
  const scan = parseScanLink(scannedText)
  if (scan?.restaurantId && scan?.tableId) {
    return {
      restaurantId: scan.restaurantId,
      rid: scan.restaurantId,
      tableId: scan.tableId,
      tableToken: null,
      tableNumber: scan.tableNumber || null,
      slug: null,
    }
  }

  const parsed = parseTableBookingLink(scannedText)
  if (!parsed) return null

  const slugMatch = String(scannedText || '').match(/\/r\/([^/]+)\/order/i)

  return {
    tableToken: parsed.tableToken,
    tableId: parsed.tableId,
    tableNumber: parsed.tableNumber,
    rid: parsed.rid,
    restaurantId: parsed.rid,
    slug: parsed.slug || slugMatch?.[1] || null,
  }
}
