import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useSavoriaGuestOptional } from '../contexts/SavoriaGuestContext'
import { getNavbarDashboardPath, navigateToProfileDashboard } from '../utils/panelRole'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'

/** Unified auth state for marketing site + guest panel (navbar, landing CTAs). */
export function useAppAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const guestAuth = useSavoriaGuestOptional()
  const { user, accessToken, memberships } = useSelector((s) => s.auth)
  const savoriaAuth = loadSavoriaSession()?.auth

  const isLoggedIn = Boolean(
    guestAuth?.isAuthenticated
    || (accessToken && user)
    || savoriaAuth?.verified
    || savoriaAuth?.verifiedAt,
  )

  const displayName = guestAuth?.userDisplayName
    || user?.name?.split(/\s+/)[0]
    || savoriaAuth?.name?.split(/\s+/)[0]
    || 'Guest'

  const dashboardPath = getNavbarDashboardPath(
    user,
    memberships,
    user?.phone || savoriaAuth?.phone,
  ) || '/order/dashboard'

  const goToDashboard = () => {
    navigateToProfileDashboard({
      navigate,
      dispatch,
      user,
      memberships,
      phoneHint: user?.phone || savoriaAuth?.phone,
      accessToken,
      openAuthModal: guestAuth?.openAuthModal,
    })
  }

  const openLogin = (redirectPath = dashboardPath) => {
    if (isLoggedIn) {
      goToDashboard()
      return
    }
    guestAuth?.openAuthModal({ mode: 'login', redirectPath })
  }

  const openSignup = (redirectPath = '/order/dashboard') => {
    if (isLoggedIn) {
      goToDashboard()
      return
    }
    guestAuth?.openAuthModal({ mode: 'signup', redirectPath })
  }

  return {
    isLoggedIn,
    displayName,
    dashboardPath,
    goToDashboard,
    openLogin,
    openSignup,
    user,
    accessToken,
    memberships,
    guestAuth,
    savoriaAuth,
  }
}
