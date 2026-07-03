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
    authGateLoginRole,
    closeAuthModal,
    openAuthModal,
  } = useSavoriaGuest()

  useEffect(() => {
    if (!location.state?.openAuth) return

    const from = location.state?.from
    const fromPath = from?.pathname || ''
    const authRole = location.state?.authRole || 'user'

    let redirectPath = location.state?.redirectPath
    if (!redirectPath) {
      if (fromPath.startsWith('/platform')) redirectPath = '/platform'
      else if (fromPath) redirectPath = `${fromPath}${from.search || ''}`
      else redirectPath = '/order/dashboard'
    }

    openAuthModal({
      mode: 'login',
      redirectPath,
      loginRole: authRole,
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
      loginRole={authGateLoginRole}
      returnTo={location.state?.from}
      onClose={closeAuthModal}
    />
  )
}
