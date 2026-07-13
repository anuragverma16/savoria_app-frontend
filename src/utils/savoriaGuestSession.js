const SESSION_KEY = 'savoria_guest_session'
const CUSTOMER_AUTH_KEY = 'savoria_customer_auth'

export function loadPersistedCustomerAuth() {
  try {
    const raw = localStorage.getItem(CUSTOMER_AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function savePersistedCustomerAuth({ phone, auth, customerTokens } = {}) {
  if (!customerTokens?.accessToken && !auth?.verified) return null
  const payload = {
    phone: phone || auth?.phone || null,
    auth: auth || null,
    customerTokens: customerTokens || null,
    updatedAt: Date.now(),
  }
  localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(payload))
  return payload
}

export function clearPersistedCustomerAuth() {
  localStorage.removeItem(CUSTOMER_AUTH_KEY)
}

/** Merge durable customer login into savoria session (survives QR re-scan) */
export function restoreCustomerAuthIntoSession() {
  const current = loadSavoriaSession() || {}
  if (current.auth?.verified && current.customerTokens?.accessToken) {
    return current
  }

  const persisted = loadPersistedCustomerAuth()
  if (!persisted?.customerTokens?.accessToken) return current

  return patchSavoriaSession({
    auth: persisted.auth || current.auth,
    orderCustomerAuth: true,
    customerTokens: persisted.customerTokens,
  })
}

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
    auth: existing.auth || null,
    orderCustomerAuth: Boolean(
      existing.orderCustomerAuth || existing.auth?.verified || existing.customerTokens?.accessToken,
    ),
    customerTokens: existing.customerTokens || null,
    orders: isNewTableScan ? [] : (existing.orders || []),
    scanLocked: isNewTableScan ? false : (existing.scanLocked || false),
    qrLinked: Boolean((rid || existing.rid) && (tableId || existing.tableId)),
    updatedAt: Date.now(),
  }

  saveSavoriaSession(session)
  return restoreCustomerAuthIntoSession()
}
