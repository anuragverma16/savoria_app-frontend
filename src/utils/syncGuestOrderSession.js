import { setActiveRestaurant } from '../store/slices/tenantSlice'
import { initCart } from '../store/slices/cartSlice'
import { loadSavoriaSession } from './savoriaGuestSession'
import { loadUserTableSession } from './userTableSession'
import { linkTableFromQr } from './linkTableFromQr'
import { normalizeRestaurant, restaurantIdOf } from './panelRole'

/** After OTP login, align tenant + server table session and restore guest cart. */
export async function syncGuestOrderSessionAfterAuth(
  dispatch,
  { user, memberships } = {},
  { preserveTenant = false } = {},
) {
  const session = loadSavoriaSession() || {}
  const rid = session.rid
  if (!rid) return { synced: false }

  const membership = (memberships || []).find(
    (m) => m.isActive !== false && restaurantIdOf(m) === String(rid),
  )
  const restaurant = normalizeRestaurant(membership?.restaurant)
    || {
      _id: rid,
      slug: session.slug,
      name: session.restaurantName,
    }

  if (restaurant?._id && !preserveTenant) {
    dispatch(setActiveRestaurant(restaurant))
  }

  const tableSession = loadUserTableSession(rid)
  if (tableSession?.qrLinked && (tableSession.tableToken || tableSession.tableId)) {
    dispatch(initCart({
      restaurantId: String(rid),
      tableToken: tableSession.tableToken,
      table: tableSession.table,
    }))

    if (user) {
      try {
        await linkTableFromQr(
          dispatch,
          restaurant,
          {
            tableToken: tableSession.tableToken,
            tableId: tableSession.tableId || tableSession.table?._id,
          },
          { guestName: user.name, guestPhone: user.phone },
        )
      } catch {
        /* keep local session if server check-in fails transiently */
      }
    }
  }

  return { synced: true, restaurantId: rid }
}
