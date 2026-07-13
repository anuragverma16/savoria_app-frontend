import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown, FiLogOut, FiSettings } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import { navigateHomeAfterLogout } from '../../utils/authEntry'
import { maskPhone } from '../../utils/savoriaWhatsappOtp'
import { shouldPreservePanelAuthDuringQrOrder } from '../../utils/panelAuthPreserve'

function profileInitials(name, phone) {
  const source = (name || phone || 'G').trim()
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Profile chip on menu — customer name/phone only; logout never clears panel sessions */
export default function OrderMenuProfileMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const { withQuery } = useOrderPanelQuery()
  const {
    isAuthenticated,
    userDisplayName,
    userPhone,
    logoutGuest,
    isQrTableFlow,
    paths,
  } = useSavoriaGuest()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
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
  }, [])

  if (!isAuthenticated) return null

  const initials = profileInitials(userDisplayName, userPhone)
  const phoneLabel = userPhone ? maskPhone(userPhone) : ''

  const handleLogout = () => {
    const keepPanel = shouldPreservePanelAuthDuringQrOrder()
    logoutGuest()
    close()
    toast.success(keepPanel ? 'Order account signed out' : 'Signed out')
    if (!isQrTableFlow && !keepPanel) {
      navigateHomeAfterLogout(navigate)
    }
  }

  const goSettings = () => {
    close()
    navigate(withQuery(paths.profile))
  }

  return (
    <div ref={wrapRef} className="sv-menu-profile-wrap shrink-0">
      <button
        type="button"
        className={`sv-menu-profile-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Your profile"
      >
        <span className="sv-menu-profile-avatar" aria-hidden>{initials}</span>
        <FiChevronDown size={14} className={`sv-menu-profile-chevron ${open ? 'is-open' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="sv-menu-profile-menu" role="menu">
          <div className="sv-menu-profile-head">
            <span className="sv-menu-profile-menu-avatar">{initials}</span>
            <div className="min-w-0">
              <p className="sv-menu-profile-name">{userDisplayName || 'Guest'}</p>
              {phoneLabel ? (
                <p className="sv-menu-profile-phone">{phoneLabel}</p>
              ) : null}
            </div>
          </div>
          <div className="sv-menu-profile-divider" />
          <button type="button" className="sv-menu-profile-item" onClick={goSettings}>
            <FiSettings size={15} />
            Edit profile
          </button>
          <button type="button" className="sv-menu-profile-item sv-menu-profile-logout" onClick={handleLogout}>
            <FiLogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
