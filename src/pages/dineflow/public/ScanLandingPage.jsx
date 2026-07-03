import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiMaximize2 } from 'react-icons/fi'
import { parseScanLink } from '../../../utils/scanLink'
import { validateAndLinkScan, menuPathAfterTableLink } from '../../../utils/linkGuestTablePublic'

/**
 * QR scan entry — /scan?restaurantId=&tableId=
 * Validates → stores session → redirects to restaurant menu.
 */
export default function ScanLandingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    let cancelled = false

    async function run() {
      const parsed = parseScanLink(`?${searchParams.toString()}`)
        || parseScanLink(window.location.href)

      const restaurantId = parsed?.restaurantId
        || searchParams.get('restaurantId')
        || searchParams.get('rid')
      const tableId = parsed?.tableId || searchParams.get('tableId')

      if (!restaurantId || !tableId) {
        navigate('/invalid-qr', { replace: true })
        return
      }

      try {
        const result = await validateAndLinkScan(dispatch, restaurantId, tableId)
        if (cancelled) return

        if (!result.booked) {
          if (result.code === 'TABLE_NOT_FOUND') {
            navigate('/table-not-found', { replace: true, state: { message: result.message } })
          } else {
            navigate('/table-not-found', {
              replace: true,
              state: { message: result.message || 'Table is not available right now.' },
            })
          }
          return
        }

        navigate(menuPathAfterTableLink(restaurantId, result.table, true), { replace: true })
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
        if (err.response?.status === 404) {
          const code = err.response?.data?.code
          navigate(code === 'TABLE_NOT_FOUND' ? '/table-not-found' : '/invalid-qr', { replace: true })
          return
        }
        navigate('/invalid-qr', { replace: true })
      }
    }

    run()
    return () => { cancelled = true }
  }, [searchParams, navigate, dispatch])

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center p-6 text-center">
      <FiMaximize2 className="text-emerald-400 mb-4 animate-pulse" size={44} />
      <p className="text-white font-semibold text-lg">Opening your table menu…</p>
      <p className="text-white/50 text-sm mt-2">Validating QR code</p>
    </div>
  )
}
