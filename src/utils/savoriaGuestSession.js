const SESSION_KEY = 'savoria_guest_session'

export function loadSavoriaSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSavoriaSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function patchSavoriaSession(patch) {
  const current = loadSavoriaSession() || {}
  const next = { ...current, ...patch, updatedAt: Date.now() }
  saveSavoriaSession(next)
  return next
}

export function clearSavoriaSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function linkTableFromScan(parsed = {}) {
  return patchSavoriaSession({
    rid: parsed.rid || parsed.restaurantId,
    tableToken: parsed.tableToken || parsed.table,
    tableId: parsed.tableId,
    tableNumber: parsed.tableNumber || parsed.no || null,
    slug: parsed.slug,
    qrLinked: true,
  })
}

export function appendSavoriaSessionOrder(order) {
  const current = loadSavoriaSession() || {}
  const id = order?.id || order?._id || order?.orderId
  if (!id) return current
  const existing = (current.orders || []).filter((o) => (o.id || o._id) !== id)
  const next = {
    ...order,
    id: String(id),
    restaurantId: order.restaurantId || current.rid,
  }
  return patchSavoriaSession({ orders: [next, ...existing].slice(0, 50) })
}

export function initSavoriaSessionFromParams(searchParams) {
  const rid = searchParams.get('restaurantId') || searchParams.get('rid')
  const tableToken = searchParams.get('table')
  const tableNumber = searchParams.get('no') || searchParams.get('tableNumber')
  const tableId = searchParams.get('tableId')
  const slug = searchParams.get('slug')

  const existing = loadSavoriaSession() || {}
  const isNewTableScan = Boolean(
    rid && tableId
    && (String(existing.rid) !== String(rid) || String(existing.tableId) !== String(tableId)),
  )

  const session = {
    ...existing,
    rid: rid || existing.rid,
    tableToken: tableToken || existing.tableToken,
    tableId: tableId || existing.tableId,
    tableNumber: tableNumber || existing.tableNumber,
    slug: slug || existing.slug,
    restaurantName: existing.restaurantName,
    cart: isNewTableScan ? [] : (existing.cart || []),
    auth: isNewTableScan ? null : (existing.auth || null),
    orderCustomerAuth: isNewTableScan ? false : Boolean(existing.orderCustomerAuth),
    orders: isNewTableScan ? [] : (existing.orders || []),
    scanLocked: isNewTableScan ? false : (existing.scanLocked || false),
    qrLinked: Boolean((rid || existing.rid) && (tableId || existing.tableId)),
    updatedAt: Date.now(),
  }

  saveSavoriaSession(session)
  return session
}
