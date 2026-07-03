import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { validateAndLinkScan } from '../utils/linkGuestTablePublic'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'

/**
 * When /order/* has restaurantId + tableId query params, validate QR and link session
 * before rendering the user panel.
 */
export default function OrderScanBootstrap({ children }) {
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

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
      if (
        session?.qrLinked
        && String(session.rid) === String(restaurantId)
        && String(session.tableId) === String(tableId)
      ) {
        setReady(true)
        return
      }

      setReady(false)
      try {
        const result = await validateAndLinkScan(dispatch, restaurantId, tableId)
        if (cancelled) return

        if (!result.booked) {
          navigate('/table-not-found', {
            replace: true,
            state: { message: result.message || 'Table is not available right now.' },
          })
          return
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
  }, [searchParams, dispatch, navigate])

  if (!ready) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center px-6 text-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
        <p className="text-sm text-white/60">Opening your table…</p>
      </div>
    )
  }

  return children
}
