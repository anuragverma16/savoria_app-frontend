import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { validateAndLinkScan, menuPathAfterTableLink } from '../../utils/linkGuestTablePublic'

/** Legacy /menu/:restaurantId/:tableId → full /order user panel */
export default function MenuQrRedirect() {
  const { restaurantId, tableId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!restaurantId || !tableId) {
        navigate('/invalid-qr', { replace: true })
        return
      }

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

        navigate(menuPathAfterTableLink(restaurantId, result.table, true), { replace: true })
      } catch {
        if (!cancelled) navigate('/invalid-qr', { replace: true })
      }
    }

    run()
    return () => { cancelled = true }
  }, [restaurantId, tableId, dispatch, navigate])

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center p-6 text-center">
      <p className="text-white font-semibold text-lg">Opening your table…</p>
      <p className="text-white/50 text-sm mt-2">Loading restaurant menu</p>
    </div>
  )
}
