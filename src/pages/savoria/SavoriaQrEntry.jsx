import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { initSavoriaSessionFromParams } from '../../utils/savoriaGuestSession'

/** QR entry — parses table params and redirects to welcome screen */
export default function SavoriaQrEntry() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    initSavoriaSessionFromParams(searchParams)
  }, [searchParams])

  const qs = searchParams.toString()
  return <Navigate to={qs ? `/order/dashboard?${qs}` : '/order/dashboard'} replace />
}
