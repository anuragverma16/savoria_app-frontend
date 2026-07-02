import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown, FiGrid, FiLogOut, FiSettings, FiUser, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useSavoriaGuestOptional } from '../../contexts/SavoriaGuestContext'
import { getNavbarDashboardPath } from '../../utils/panelRole'
import { shouldOpenSuperAdminPanel } from '../../utils/superAdminPhone'

function settingsPath(dashboardPath, user) {
  if (!dashboardPath?.includes('/restaurant/')) return dashboardPath
  if (user?.role === 'admin' || user?.platformRole === 'admin') {
    return dashboardPath.replace(/\/admin$/, '/settings')
  }
  return dashboardPath
}

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
  const guestAuth = useSavoriaGuestOptional()
  const { user, memberships } = useSelector((s) => s.auth)
  const phoneHint = user?.phone || guestAuth?.auth?.phone
  const dashboardPath = shouldOpenSuperAdminPanel(user, phoneHint)
    ? '/platform'
    : getNavbarDashboardPath(user, memberships, phoneHint)
  const detailsPath = dashboardPath
  const settingsLink = settingsPath(dashboardPath, user)

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
    guestAuth?.logoutGuest()
    navigate('/')
  }

  const goDashboard = () => {
    close()
    navigate(dashboardPath)
  }

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
            <button
              type="button"
              onClick={onClose}
              className="lp-nav-profile-close"
              aria-label="Close menu"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
        <button type="button" className="lp-nav-mobile-menu-item" onClick={goDashboard}>
          <FiGrid size={18} /> Dashboard
        </button>
        <button type="button" className="lp-nav-mobile-menu-item" onClick={() => { close(); navigate(detailsPath) }}>
          <FiUser size={18} /> My details
        </button>
        <button type="button" className="lp-nav-mobile-menu-item" onClick={() => { close(); navigate(settingsLink) }}>
          <FiSettings size={18} /> Settings
        </button>
        <button type="button" className="lp-nav-mobile-menu-item lp-nav-mobile-menu-logout" onClick={handleLogout}>
          <FiLogOut size={18} /> Logout
        </button>
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
        <FiChevronDown
          size={14}
          className={`lp-nav-profile-chevron ${open ? 'is-open' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className={`lp-nav-profile-menu ${isDark ? 'lp-nav-profile-menu--dark' : ''}`}
          role="menu"
        >
          <div className="lp-nav-profile-menu-head lp-nav-profile-menu-head--with-close">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="lp-nav-profile-menu-avatar">{profileInitials}</span>
              <div className="min-w-0">
                <p className="lp-nav-profile-menu-name">{fullName || profileName}</p>
                {email ? <p className="lp-nav-profile-menu-email">{email}</p> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="lp-nav-profile-close"
              aria-label="Close profile menu"
            >
              <FiX size={16} />
            </button>
          </div>
          <div className="lp-nav-profile-menu-divider" />
          <button type="button" className="lp-nav-profile-menu-item" onClick={goDashboard}>
            <FiGrid size={16} /> Dashboard
          </button>
          <button
            type="button"
            className="lp-nav-profile-menu-item"
            onClick={() => { close(); navigate(detailsPath) }}
          >
            <FiUser size={16} /> My details
          </button>
          <button
            type="button"
            className="lp-nav-profile-menu-item"
            onClick={() => { close(); navigate(settingsLink) }}
          >
            <FiSettings size={16} /> Settings
          </button>
          <div className="lp-nav-profile-menu-divider" />
          <button type="button" className="lp-nav-profile-menu-item lp-nav-profile-menu-logout" onClick={handleLogout}>
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  )
}
