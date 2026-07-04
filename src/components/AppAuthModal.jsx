import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useSavoriaGuest } from '../contexts/SavoriaGuestContext'
import { normalizeLoginRole } from '../utils/panelRole'
import SavoriaAuthGateModal from './savoria/SavoriaAuthGateModal'

/** Global auth popup — mounted once at app root */
export default function AppAuthModal() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const {
    authGateOpen,
    authGateMode,
    authGateRedirect,
    authGateLoginRole,
    closeAuthModal,
    openAuthModal,
  } = useSavoriaGuest()

  useEffect(() => {
    const roleFromQuery = searchParams.get('role')
    const shouldOpen = location.state?.openAuth || Boolean(roleFromQuery)
    if (!shouldOpen) return

    const from = location.state?.from
    const fromPath = from?.pathname || ''
    const authRole = location.state?.authRole
      || (roleFromQuery === 'superadmin' ? 'superadmin' : normalizeLoginRole(roleFromQuery))
      || 'user'

    let redirectPath = location.state?.redirectPath
    if (!redirectPath) {
      if (fromPath.startsWith('/platform')) redirectPath = '/platform'
      else if (fromPath) redirectPath = `${fromPath}${from.search || ''}`
      else if (authRole === 'user') redirectPath = '/order/dashboard'
    }

    openAuthModal({
      mode: 'login',
      redirectPath,
      loginRole: authRole,
    })

    const nextState = { ...location.state }
    delete nextState.openAuth
    const cleanSearch = new URLSearchParams(location.search)
    cleanSearch.delete('role')
    const qs = cleanSearch.toString()
    const nextUrl = location.pathname + (qs ? `?${qs}` : '') + (location.hash || '')
    window.history.replaceState(nextState, '', nextUrl)
  }, [location.state, location.pathname, location.search, location.hash, searchParams, openAuthModal])

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
