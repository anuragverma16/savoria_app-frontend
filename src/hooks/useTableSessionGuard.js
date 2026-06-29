import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { restaurantAPI } from '../api/dineflow'
import {
  clearUserTableSession,
  hasQrTableSession,
  loadUserTableSession,
  saveUserTableSession,
} from '../utils/userTableSession'
import { clearCart, initCart } from '../store/slices/cartSlice'
import { linkTableFromQr } from '../utils/linkTableFromQr'
import { buildUserTablesPath } from '../utils/tableQueryParams'

const POLL_MS = 90_000
const GRACE_MS = 15_000

/** Sync client table session with server TableSession */
export function useTableSessionGuard(restaurantId, { enabled = true, restaurant } = {}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const checking = useRef(false)
  const mountedAt = useRef(Date.now())

  useEffect(() => {
    if (!enabled || !restaurantId || !hasQrTableSession(restaurantId)) return undefined

    let cancelled = false

    async function verify() {
      if (checking.current || cancelled) return
      checking.current = true
      try {
        const { data } = await restaurantAPI(restaurantId).getMyTableSession()
        if (cancelled) return

        if (data?.active) {
          const local = loadUserTableSession(restaurantId)
          const serverTable = data.session?.table
          if (serverTable && local) {
            saveUserTableSession(restaurantId, {
              ...local,
              table: serverTable,
              tableId: serverTable._id,
              tableToken: serverTable.qrToken || local.tableToken,
              sessionExpiresAt: data.session?.expiresAt,
              qrLinked: true,
            })
            dispatch(initCart({
              restaurantId: String(restaurantId),
              tableToken: serverTable.qrToken || local.tableToken,
              table: serverTable,
            }))
          }
          return
        }

        if (Date.now() - mountedAt.current < GRACE_MS) return

        const local = loadUserTableSession(restaurantId)
        if (local?.tableToken && restaurant?._id) {
          const result = await linkTableFromQr(
            dispatch,
            restaurant,
            {
              tableToken: local.tableToken,
              tableId: local.tableId || local.table?._id,
            },
            { guestName: local.guestName, guestPhone: local.guestPhone },
          )
          if (result.booked) return
        }

        clearUserTableSession(restaurantId)
        dispatch(clearCart())
        dispatch(initCart({
          restaurantId: String(restaurantId),
          tableToken: 'user-panel',
          table: null,
        }))
        navigate(buildUserTablesPath(restaurantId), { replace: true })
      } catch {
        /* keep local session on network errors */
      } finally {
        checking.current = false
      }
    }

    const timer = setTimeout(verify, GRACE_MS)
    const interval = setInterval(verify, POLL_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [restaurantId, enabled, dispatch, navigate, restaurant])
}
