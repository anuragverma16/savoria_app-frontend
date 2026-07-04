import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiArrowRight, FiUser } from 'react-icons/fi'
import { gsap } from '../../utils/gsapSetup'
import ThemeToggle from './ThemeToggle'
import BrandLogo from './BrandLogo'
import BrandMark from './BrandMark'
import NavbarProfileMenu from './NavbarProfileMenu'
import { useSavoriaGuestOptional } from '../../contexts/SavoriaGuestContext'
import { useAppAuth } from '../../hooks/useAppAuth'

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Video', href: '/#video' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
]

const ORDER_DASHBOARD = '/order/dashboard'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function SiteNavbar({ variant = 'light' }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef(null)
  const logoRef = useRef(null)
  const location = useLocation()
  const guestAuth = useSavoriaGuestOptional()
  const { isLoggedIn, displayName: profileName, savoriaAuth, goToDashboard, openLogin, user, dashboardMeta } = useAppAuth()
  const profileFullName = guestAuth?.auth?.name || user?.name || savoriaAuth?.name || profileName
  const profileEmail = guestAuth?.auth?.email || user?.email || savoriaAuth?.email || ''
  const profileInitials = (profileFullName || 'G')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const isDark = variant === 'dark'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    if (!navRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -28,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      })
      gsap.from('.lp-nav-item', {
        opacity: 0,
        y: -10,
        stagger: 0.06,
        duration: 0.45,
        delay: 0.25,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === '/' && !location.hash) {
      scrollToTop()
    }
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const linkClass = `lp-nav-link ${isDark ? 'lp-nav-link--dark' : ''}`

  const closeMenu = () => setOpen(false)

  const handleHomeClick = (e) => {
    closeMenu()
    if (location.pathname === '/') {
      e.preventDefault()
      if (location.hash) {
        window.history.replaceState(null, '', '/')
      }
      scrollToTop()
    }
  }

  const handleSignIn = (e) => {
    e?.preventDefault?.()
    closeMenu()
    openLogin(ORDER_DASHBOARD)
  }

  const handleSignUp = (e) => {
    e?.preventDefault?.()
    closeMenu()
    if (isLoggedIn) {
      goToDashboard()
      return
    }
    guestAuth?.openAuthModal({
      mode: 'signup',
      redirectPath: ORDER_DASHBOARD,
    })
  }

  const navItem = (item, extraClass = 'lp-nav-item') => {
    const cls = `${linkClass} ${extraClass}`
    if (item.href === '/') {
      return (
        <Link key={item.label} to="/" className={cls} onClick={handleHomeClick}>
          {item.label}
        </Link>
      )
    }
    if (item.href.startsWith('/') && !item.href.includes('#')) {
      return <Link key={item.label} to={item.href} className={cls} onClick={closeMenu}>{item.label}</Link>
    }
    return <a key={item.label} href={item.href} className={cls} onClick={closeMenu}>{item.label}</a>
  }

  const profileProps = {
    profileName,
    profileInitials,
    fullName: profileFullName,
    email: profileEmail,
    isDark,
  }

  return (
    <header className={`lp-premium-nav-shell ${isDark ? 'lp-premium-nav-shell--fixed' : ''}`}>
      <div
        ref={navRef}
        className={`lp-premium-nav max-w-7xl mx-auto ${scrolled ? 'lp-premium-nav--scrolled' : ''} ${isDark ? 'lp-premium-nav--dark' : ''} ${open ? 'lp-premium-nav--menu-open' : ''}`}
      >
        <div className="lp-premium-nav-inner flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 h-14 sm:h-[4.25rem] min-h-[3.5rem]">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 group lp-nav-item"
            onClick={handleHomeClick}
            onMouseEnter={() => {
              if (logoRef.current) {
                gsap.to(logoRef.current, { rotate: -8, scale: 1.08, duration: 0.35, ease: 'back.out(2)' })
              }
            }}
            onMouseLeave={() => {
              if (logoRef.current) {
                gsap.to(logoRef.current, { rotate: 0, scale: 1, duration: 0.4, ease: 'power2.out' })
              }
            }}
          >
            <div ref={logoRef} className="shrink-0">
              <BrandMark size="sm" className="group-hover:shadow-orange-500/40 transition-shadow" />
            </div>
            <BrandLogo
              className={`text-base sm:text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}
              accentClass={isDark ? 'text-amber-400' : 'text-orange-500'}
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map((item) => navItem(item))}
          </nav>

          {/* Desktop only — hidden on phone/tablet */}
          <div className="lp-nav-desktop-actions">
            <ThemeToggle />
            {isLoggedIn ? (
              <NavbarProfileMenu {...profileProps} />
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="lp-nav-cta"
              >
                Sign in
                <FiArrowRight size={16} />
              </button>
            )}
          </div>

          {/* Mobile only — hamburger menu (no other buttons in bar) */}
          <div className="lp-nav-mobile-bar">
            <button
              type="button"
              className={`lp-nav-menu-btn ${isDark ? 'lp-nav-menu-btn--dark' : 'lp-nav-menu-btn--light'} ${open ? 'is-open' : ''}`}
              onClick={() => (open ? closeMenu() : setOpen(true))}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? (
                <FiX size={24} strokeWidth={2.5} className="lp-nav-menu-btn-icon lp-nav-menu-btn-icon--close" aria-hidden />
              ) : (
                <FiMenu size={22} strokeWidth={2} className="lp-nav-menu-btn-icon" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <>
            <div className="lp-nav-mobile-backdrop" aria-hidden />
            <div className={`lp-nav-mobile-panel ${isDark ? 'lp-nav-mobile-panel--dark' : 'lp-nav-mobile-panel--light'}`}>
              {/* Book Now + Sign in — always at top on mobile */}
              <div className="lp-nav-mobile-actions lp-nav-mobile-actions--primary">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu()
                      goToDashboard()
                    }}
                    className="lp-nav-mobile-btn lp-nav-mobile-btn--signin"
                  >
                    {dashboardMeta?.label || 'Dashboard'}
                    <FiArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="lp-nav-mobile-btn lp-nav-mobile-btn--signin"
                  >
                    Sign in
                    <FiArrowRight size={17} />
                  </button>
                )}
              </div>

              <nav className="lp-nav-mobile-links">
                {NAV.map((item) => navItem(item, ''))}
              </nav>

              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="lp-nav-mobile-signup w-full justify-center py-3"
                >
                  <FiUser size={17} /> Create account
                </button>
              )}

              {isLoggedIn && (
                <div className="lp-nav-mobile-profile-block">
                  <NavbarProfileMenu {...profileProps} mobile onClose={closeMenu} />
                </div>
              )}

              <div className="lp-nav-mobile-footer">
                <span className="lp-nav-mobile-footer-label">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
