import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiGrid, FiLogOut, FiSettings, FiUser } from 'react-icons/fi'
import { useSavoriaGuestOptional } from '../../contexts/SavoriaGuestContext'

const DASHBOARD = '/order/dashboard'

export default function NavbarProfileMenu({
  profileName,
  profileInitials,
  fullName,
  email,
  isDark,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const guestAuth = useSavoriaGuestOptional()

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    guestAuth?.logoutGuest()
    navigate('/')
  }

  return (
    <div
      ref={wrapRef}
      className="lp-nav-profile-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`lp-nav-cta lp-nav-profile ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="lp-nav-profile-avatar" aria-hidden>{profileInitials}</span>
        <span className="lp-nav-profile-name">{profileName}</span>
      </button>

      {open && (
        <div className={`lp-nav-profile-menu ${isDark ? 'lp-nav-profile-menu--dark' : ''}`}>
          <div className="lp-nav-profile-menu-head">
            <span className="lp-nav-profile-menu-avatar">{profileInitials}</span>
            <div className="min-w-0">
              <p className="lp-nav-profile-menu-name">{fullName || profileName}</p>
              {email ? <p className="lp-nav-profile-menu-email">{email}</p> : null}
            </div>
          </div>
          <div className="lp-nav-profile-menu-divider" />
          <Link
            to={DASHBOARD}
            className="lp-nav-profile-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiGrid size={16} /> Dashboard
          </Link>
          <Link
            to={DASHBOARD}
            className="lp-nav-profile-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiUser size={16} /> My details
          </Link>
          <Link
            to={DASHBOARD}
            className="lp-nav-profile-menu-item"
            onClick={() => setOpen(false)}
          >
            <FiSettings size={16} /> Settings
          </Link>
          <div className="lp-nav-profile-menu-divider" />
          <button type="button" className="lp-nav-profile-menu-item lp-nav-profile-menu-logout" onClick={handleLogout}>
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  )
}
