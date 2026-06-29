import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiLink } from 'react-icons/fi'
import { hasScanParams } from '../../../utils/scanLink'

/**
 * Legacy /book-table and /scan-table — forward to /scan when possible.
 */
export default function TableQrLanding() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (hasScanParams(searchParams)) {
      navigate(`/scan?${searchParams.toString()}`, { replace: true })
      return
    }

    const restaurantId = searchParams.get('restaurantId') || searchParams.get('rid')
    const tableId = searchParams.get('tableId')
    if (restaurantId && tableId) {
      const qs = new URLSearchParams()
      qs.set('restaurantId', restaurantId)
      qs.set('tableId', tableId)
      navigate(`/scan?${qs.toString()}`, { replace: true })
      return
    }

    navigate('/invalid-qr', { replace: true })
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center p-6 text-center">
      <FiLink className="text-amber-400 mb-4 animate-pulse" size={44} />
      <p className="text-white font-semibold text-lg">Redirecting…</p>
    </div>
  )
}
