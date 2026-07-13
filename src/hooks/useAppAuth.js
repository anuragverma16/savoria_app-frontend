import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useSavoriaGuestOptional } from '../contexts/SavoriaGuestContext'
import { getNavbarDashboardPath, navigateToProfileDashboard } from '../utils/panelRole'
import { isPanelAccountUser } from '../utils/panelAuthPreserve'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'
import { resolveCustomerDisplayName } from '../utils/customerDisplayName'

/** Unified auth state for marketing site + guest panel (navbar, landing CTAs). */
export function useAppAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const guestAuth = useSavoriaGuestOptional()
  const { user, accessToken, memberships, refreshToken } = useSelector((s) => s.auth)
  const savoriaAuth = loadSavoriaSession()?.auth

  const panelAccount = Boolean(accessToken && user && isPanelAccountUser(user))

  const isLoggedIn = Boolean(
    (accessToken && user)
    || (!panelAccount && guestAuth?.isAuthenticated),
  )

  const displayName = panelAccount
    ? resolveCustomerDisplayName(user?.name)
    : resolveCustomerDisplayName(
      guestAuth?.userDisplayName,
      guestAuth?.auth?.name,
      savoriaAuth?.name,
      user?.name,
    ) || (isLoggedIn ? 'Account' : 'Guest')

  const dashboardPath = getNavbarDashboardPath(
    user,
    memberships,
    panelAccount ? user?.phone : (user?.phone || savoriaAuth?.phone),
  ) || '/order/dashboard'

  const goToDashboard = () => {
    navigateToProfileDashboard({
      navigate,
      dispatch,
      user,
      memberships,
      phoneHint: panelAccount ? user?.phone : (user?.phone || savoriaAuth?.phone),
      accessToken,
      refreshToken,
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
