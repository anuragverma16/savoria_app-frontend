import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSavoriaGuest } from '../contexts/SavoriaGuestContext'
import { resolveLockedMenuPath } from '../utils/orderPanelPaths'

const ORDER_PREFIX = '/order'

function isOrderPanelPath(pathname = '') {
  return pathname.startsWith(ORDER_PREFIX)
}

/** Keep QR diners inside /order/* — browser back must not return to site homepage */
export default function ScanFlowHistoryLock() {
  const navigate = useNavigate()
  const { session } = useSavoriaGuest()

  const locked = Boolean(session?.scanLocked && session?.qrLinked && session?.rid && session?.tableId)

  const menuPath = useMemo(() => resolveLockedMenuPath(session), [
    session?.rid,
    session?.tableId,
    session?.tableNumber,
    session?.tableToken,
  ])

  useEffect(() => {
    if (!locked) return undefined

    const onPopState = () => {
      window.setTimeout(() => {
        if (!isOrderPanelPath(window.location.pathname)) {
          navigate(menuPath, { replace: true })
        }
      }, 0)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [locked, menuPath, navigate])

  return null
}
