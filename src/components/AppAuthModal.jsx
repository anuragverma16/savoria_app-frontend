import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSavoriaGuest } from '../contexts/SavoriaGuestContext'
import SavoriaAuthGateModal from './savoria/SavoriaAuthGateModal'

/** Global auth popup — mounted once at app root */
export default function AppAuthModal() {
  const location = useLocation()
  const {
    authGateOpen,
    authGateMode,
    authGateRedirect,
    closeAuthModal,
    openAuthModal,
  } = useSavoriaGuest()

  useEffect(() => {
    if (!location.state?.openAuth) return

    const fromPath = location.state?.from?.pathname || ''
    const redirectPath = fromPath.startsWith('/platform') ? '/platform' : '/order/dashboard'

    openAuthModal({
      mode: 'login',
      redirectPath,
    })

    const nextState = { ...location.state }
    delete nextState.openAuth
    window.history.replaceState(nextState, '', location.pathname + location.search + location.hash)
  }, [location.state, location.pathname, location.search, location.hash, openAuthModal])

  return (
    <SavoriaAuthGateModal
      open={authGateOpen}
      mode={authGateMode}
      redirectPath={authGateRedirect}
      onClose={closeAuthModal}
    />
  )
}
