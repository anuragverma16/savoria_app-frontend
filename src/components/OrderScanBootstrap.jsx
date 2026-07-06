import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { bootstrapScanMenuLink } from '../utils/linkGuestTablePublic'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { buildOrderQueryParams, resolveTableNumber } from '../utils/orderPanelPaths'

function buildSyncedOrderPath(location, restaurantId, tableMeta) {
  const qs = buildOrderQueryParams(restaurantId, tableMeta).toString()
  return `${location.pathname}?${qs}`
}

function normalizeTableNo(value) {
  if (value == null || value === '') return null
  const s = String(value).trim()
  const num = Number(s)
  if (!Number.isNaN(num) && Number.isFinite(num)) return String(num)
  return s
}

function urlNeedsTableNumber(searchParams, tableNumber) {
  const normalized = normalizeTableNo(tableNumber)
  if (!normalized) return false
  const current = normalizeTableNo(
    searchParams.get('no') || searchParams.get('tableNumber'),
  )
  return current !== normalized
}

function sessionMatchesScan(session, restaurantId, tableId) {
  return Boolean(
    session?.qrLinked
    && String(session.rid) === String(restaurantId)
    && String(session.tableId) === String(tableId),
  )
}

function isBootstrapReady(searchParams) {
  const restaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
  const tableId = searchParams.get('tableId')
  if (!restaurantId || !tableId) return true
  const session = loadSavoriaSession()
  if (sessionMatchesScan(session, restaurantId, tableId)) return true
  return false
}

/**
 * When /order/* has restaurantId + tableId query params, validate QR and link session
 * before rendering the user panel. Keeps table number in the URL (?no=).
 */
export default function OrderScanBootstrap({ children }) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [ready, setReady] = useState(() => isBootstrapReady(searchParams))

  useEffect(() => {
    let cancelled = false

    async function run() {
      const restaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
      const tableId = searchParams.get('tableId')

      if (!restaurantId || !tableId) {
        setReady(true)
        return
      }

      const session = loadSavoriaSession()
      const urlTableNo = searchParams.get('no') || searchParams.get('tableNumber')

      if (sessionMatchesScan(session, restaurantId, tableId)) {
        const tableNumber = resolveTableNumber(
          { tableNumber: urlTableNo },
          session.tableNumber || session.table?.tableNumber,
        )
        if (urlNeedsTableNumber(searchParams, tableNumber)) {
          navigate(buildSyncedOrderPath(location, restaurantId, {
            tableId,
            tableToken: session.tableToken,
            tableNumber,
          }), { replace: true })
        }
        setReady(true)
        return
      }

      setReady(false)
      try {
        const result = await bootstrapScanMenuLink(dispatch, restaurantId, tableId)
        if (cancelled) return

        if (!result.booked) {
          navigate('/table-not-found', {
            replace: true,
            state: { message: result.message || 'Table is not available right now.' },
          })
          return
        }

        const tableNumber = resolveTableNumber(result.table, urlTableNo)
        if (urlNeedsTableNumber(searchParams, tableNumber)) {
          navigate(buildSyncedOrderPath(location, restaurantId, {
            ...result.table,
            tableId: result.table?._id || tableId,
            tableNumber,
          }), { replace: true })
        }

        setReady(true)
      } catch (err) {
        if (cancelled) return
        if (err.code === 'INVALID_QR') {
          navigate('/invalid-qr', { replace: true })
          return
        }
        if (err.code === 'TABLE_NOT_FOUND') {
          navigate('/table-not-found', { replace: true })
          return
        }
        navigate('/invalid-qr', { replace: true })
      }
    }

    run()
    return () => { cancelled = true }
  }, [searchParams, location.pathname, location.search, dispatch, navigate])

  if (!ready) {
    return (
      <div className="sv-loading-table">
        <div className="sv-loading-table-spinner" aria-hidden />
        <p className="text-sm font-medium text-[var(--sv-text)]">Setting up your table</p>
        <p className="text-xs text-[var(--sv-text-muted)] max-w-[16rem]">Loading the menu for your visit…</p>
      </div>
    )
  }

  return children
}
