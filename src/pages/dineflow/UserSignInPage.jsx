import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const ORDER_ENTRY = '/order/tables?scan=1'

function resolveReturnPath(location) {
  const from = location.state?.from
  if (from?.pathname?.startsWith('/order')) {
    return `${from.pathname}${from.search || ''}`
  }
  return ORDER_ENTRY
}

/** Legacy route — sends guests to scan QR (auth only opens from View cart) */
export default function UserSignInPage() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    navigate(resolveReturnPath(location), { replace: true })
  }, [location, navigate])

  return null
}
