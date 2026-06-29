function normId(id) {

  if (id == null || id === '') return ''

  return String(id)

}



function sessionKey(restaurantId) {

  return `dineflow_user_table_${normId(restaurantId)}`

}



export function loadUserTableSession(restaurantId) {

  try {

    const raw = localStorage.getItem(sessionKey(restaurantId))

    return raw ? JSON.parse(raw) : null

  } catch {

    return null

  }

}



export function saveUserTableSession(restaurantId, session) {

  if (!restaurantId || !session?.tableToken) return

  const tableId = session.tableId || session.table?._id || null

  localStorage.setItem(sessionKey(restaurantId), JSON.stringify({

    restaurantId: normId(restaurantId),

    tableId: tableId ? String(tableId) : null,

    tableToken: session.tableToken,

    table: session.table,

    guestCount: 1,

    guestName: session.guestName || '',

    guestPhone: session.guestPhone || '',

    qrLinked: Boolean(session.qrLinked),

    linkedAt: session.linkedAt || Date.now(),

    sessionExpiresAt: session.sessionExpiresAt || null,

  }))

}



export function clearUserTableSession(restaurantId) {

  localStorage.removeItem(sessionKey(restaurantId))

}



export function isDineInSession(tableToken) {

  return Boolean(tableToken && tableToken !== 'user-panel')

}



/** True only after validated QR scan and server check-in */

export function hasQrTableSession(restaurantId) {

  const session = loadUserTableSession(restaurantId)

  if (!session?.qrLinked) return false

  if (!isDineInSession(session.tableToken)) return false

  if (session.sessionExpiresAt && Date.now() > new Date(session.sessionExpiresAt).getTime()) {

    return false

  }

  return Boolean(session.table?._id || session.tableId || session.table?.qrToken)

}



export function getQrTableSession(restaurantId) {

  return hasQrTableSession(restaurantId) ? loadUserTableSession(restaurantId) : null

}



export function getLinkedTableNumber(restaurantId) {

  const session = getQrTableSession(restaurantId)

  if (!session) return null

  return session.table?.tableNumber || session.table?.label || null

}


