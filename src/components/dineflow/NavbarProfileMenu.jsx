import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown, FiGrid, FiLogOut, FiSettings, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useSavoriaGuestOptional } from '../../contexts/SavoriaGuestContext'
import { loadSavoriaSession } from '../../utils/savoriaGuestSession'
import { navigateHomeAfterLogout } from '../../utils/authEntry'
import {
  dashboardPathRequiresAuth,
  getNavbarSettingsPath,
  navigateToProfileDashboard,
} from '../../utils/panelRole'
import { isPanelAccountUser } from '../../utils/panelAuthPreserve'

export default function NavbarProfileMenu({
  profileName,
  profileInitials,
  fullName,
  email,
  isDark,
  mobile = false,
  onClose,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const guestAuth = useSavoriaGuestOptional()
  const savoriaAuth = loadSavoriaSession()?.auth
  const { user, memberships, accessToken, refreshToken } = useSelector((s) => s.auth)
  const panelAccount = Boolean(accessToken && user && isPanelAccountUser(user))
  const phoneHint = panelAccount
    ? user?.phone
    : (user?.phone || guestAuth?.auth?.phone || savoriaAuth?.phone)
  const settingsPath = getNavbarSettingsPath(user, memberships, phoneHint)

  const close = useCallback(() => {
    setOpen(false)
    onClose?.()
  }, [onClose])

  useEffect(() => {
    if (mobile) return undefined
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [mobile])

  const handleLogout = () => {
    close()
    guestAuth?.logoutGuest({ full: panelAccount })
    navigateHomeAfterLogout(navigate)
  }

  const goDashboard = () => {
    close()
    navigateToProfileDashboard({
      navigate,
      dispatch,
      user,
      memberships,
      phoneHint,
      accessToken,
      refreshToken,
      openAuthModal: guestAuth?.openAuthModal,
    })
  }

  const goSettings = () => {
    close()
    const path = settingsPath || '/order/settings'

    if (dashboardPathRequiresAuth(path) && (!accessToken || !user)) {
      guestAuth?.openAuthModal({
        mode: 'login',
        redirectPath: path,
      })
      return
    }

    navigate(path)
  }

  const menuItems = (
    <>
      <button type="button" className={mobile ? 'lp-nav-mobile-menu-item' : 'lp-nav-profile-menu-item'} onClick={goDashboard}>
        <FiGrid size={mobile ? 18 : 16} /> Dashboard
      </button>
      <button type="button" className={mobile ? 'lp-nav-mobile-menu-item' : 'lp-nav-profile-menu-item'} onClick={goSettings}>
        <FiSettings size={mobile ? 18 : 16} /> Settings
      </button>
      <button
        type="button"
        className={`${mobile ? 'lp-nav-mobile-menu-item lp-nav-mobile-menu-logout' : 'lp-nav-profile-menu-item lp-nav-profile-menu-logout'}`}
        onClick={handleLogout}
      >
        <FiLogOut size={mobile ? 18 : 16} /> Logout
      </button>
    </>
  )

  if (mobile) {
    return (
      <div className={`lp-nav-profile-mobile ${isDark ? 'lp-nav-profile-mobile--dark' : ''}`}>
        <div className="lp-nav-profile-menu-head lp-nav-profile-menu-head--with-close">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="lp-nav-profile-menu-avatar">{profileInitials}</span>
            <div className="min-w-0">
              <p className="lp-nav-profile-menu-name">{fullName || profileName}</p>
              {email ? <p className="lp-nav-profile-menu-email">{email}</p> : null}
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="lp-nav-profile-close" aria-label="Close menu">
              <FiX size={18} />
            </button>
          )}
        </div>
        {menuItems}
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="lp-nav-profile-wrap">
      <button
        type="button"
        className={`lp-nav-cta lp-nav-profile ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        <span className="lp-nav-profile-avatar" aria-hidden>{profileInitials}</span>
        <span className="lp-nav-profile-name">{profileName}</span>
        <FiChevronDown size={14} className={`lp-nav-profile-chevron ${open ? 'is-open' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className={`lp-nav-profile-menu ${isDark ? 'lp-nav-profile-menu--dark' : ''}`} role="menu">
          <div className="lp-nav-profile-menu-head lp-nav-profile-menu-head--with-close">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="lp-nav-profile-menu-avatar">{profileInitials}</span>
              <div className="min-w-0">
                <p className="lp-nav-profile-menu-name">{fullName || profileName}</p>
                {email ? <p className="lp-nav-profile-menu-email">{email}</p> : null}
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="lp-nav-profile-close" aria-label="Close profile menu">
              <FiX size={16} />
            </button>
          </div>
          <div className="lp-nav-profile-menu-divider" />
          {menuItems}
        </div>
      )}
    </div>
  )
}
