import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiMenu, FiX, FiArrowRight, FiCalendar, FiUser } from 'react-icons/fi'
import { gsap } from '../../utils/gsapSetup'
import ThemeToggle from './ThemeToggle'
import BrandLogo from './BrandLogo'
import BrandMark from './BrandMark'
import { loadSavoriaSession } from '../../utils/savoriaGuestSession'
import { useSavoriaGuestOptional } from '../../contexts/SavoriaGuestContext'
import NavbarProfileMenu from './NavbarProfileMenu'

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Video', href: '/#video' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
]

const ORDER_ENTRY = '/order/dashboard'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function SiteNavbar({ variant = 'light' }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef(null)
  const logoRef = useRef(null)
  const bookNowRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, accessToken } = useSelector((s) => s.auth)
  const guestAuth = useSavoriaGuestOptional()
  const savoriaAuth = loadSavoriaSession()?.auth
  const isLoggedIn = Boolean(
    (accessToken && user) || savoriaAuth?.verified || savoriaAuth?.verifiedAt,
  )
  const profileName = guestAuth?.userDisplayName
    || user?.name?.split(/\s+/)[0]
    || savoriaAuth?.name?.split(/\s+/)[0]
    || 'Guest'
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
      if (bookNowRef.current) {
        gsap.from(bookNowRef.current, {
          scale: 0.8,
          opacity: 0,
          duration: 0.5,
          delay: 0.4,
          ease: 'back.out(2)',
          clearProps: 'opacity,transform',
        })
      }
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

  const linkClass = `lp-nav-link ${isDark ? 'lp-nav-link--dark' : ''}`

  const handleHomeClick = (e) => {
    setOpen(false)
    if (location.pathname === '/') {
      e.preventDefault()
      if (location.hash) {
        window.history.replaceState(null, '', '/')
      }
      scrollToTop()
    }
  }

  const handleBookNow = (e) => {
    e?.preventDefault?.()
    setOpen(false)
    if (bookNowRef.current) {
      gsap.to(bookNowRef.current, {
        scale: 0.92,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => navigate(ORDER_ENTRY),
      })
    } else {
      navigate(ORDER_ENTRY)
    }
  }

  const handleSignIn = (e) => {
    e?.preventDefault?.()
    setOpen(false)
    if (isLoggedIn) {
      navigate(ORDER_ENTRY)
      return
    }
    guestAuth?.openAuthModal({
      mode: 'login',
      redirectPath: '/order/dashboard',
    })
  }

  const handleSignUp = (e) => {
    e?.preventDefault?.()
    setOpen(false)
    guestAuth?.openAuthModal({
      mode: 'signup',
      redirectPath: '/order/dashboard',
    })
  }

  const navItem = (item) => {
    const cls = `${linkClass} lp-nav-item`
    if (item.href === '/') {
      return (
        <Link key={item.label} to="/" className={cls} onClick={handleHomeClick}>
          {item.label}
        </Link>
      )
    }
    if (item.href.startsWith('/') && !item.href.includes('#')) {
      return <Link key={item.label} to={item.href} className={cls}>{item.label}</Link>
    }
    return <a key={item.label} href={item.href} className={cls}>{item.label}</a>
  }

  return (
    <header className={`lp-premium-nav-shell ${isDark ? 'lp-premium-nav-shell--fixed' : ''}`}>
      <div
        ref={navRef}
        className={`lp-premium-nav max-w-7xl mx-auto ${scrolled ? 'lp-premium-nav--scrolled' : ''} ${isDark ? 'lp-premium-nav--dark' : ''}`}
      >
        <div className="lp-premium-nav-inner flex items-center justify-between gap-4 px-4 sm:px-6 h-[4.25rem]">
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 group lp-nav-item"
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
            <div ref={logoRef}>
              <BrandMark size="sm" className="group-hover:shadow-orange-500/40 transition-shadow" />
            </div>
            <BrandLogo
              className={`text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}
              accentClass={isDark ? 'text-amber-400' : 'text-orange-500'}
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => navItem(item))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 relative z-20">
            <ThemeToggle />
            <button
              ref={bookNowRef}
              type="button"
              onClick={handleBookNow}
              className="lp-nav-book-now hidden sm:inline-flex items-center gap-2"
            >
              <FiCalendar size={15} />
              Book Now
            </button>
            {isLoggedIn ? (
              <NavbarProfileMenu
                profileName={profileName}
                profileInitials={profileInitials}
                fullName={profileFullName}
                email={profileEmail}
                isDark={isDark}
              />
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="lp-nav-cta hidden sm:inline-flex items-center gap-2"
              >
                Sign in
                <FiArrowRight size={16} />
              </button>
            )}
            <button
              type="button"
              className="lg:hidden lp-nav-menu-btn"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden px-4 pb-5 border-t border-white/10">
            <nav className="flex flex-col gap-1 pt-3">
              {NAV.map((item) => (
                item.href === '/' ? (
                  <Link
                    key={item.label}
                    to="/"
                    className={`${linkClass} block py-3 px-3 text-base`}
                    onClick={handleHomeClick}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`${linkClass} block py-3 px-3 text-base`}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              ))}
              <button
                type="button"
                onClick={handleBookNow}
                className="lp-nav-book-now w-full justify-center mt-3 py-3"
              >
                <FiCalendar size={16} /> Book Now
              </button>
              {isLoggedIn ? (
                <div className="mt-2">
                  <NavbarProfileMenu
                    profileName={profileName}
                    profileInitials={profileInitials}
                    fullName={profileFullName}
                    email={profileEmail}
                    isDark={isDark}
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="lp-nav-cta w-full justify-center mt-2 py-3"
                  >
                    Sign in <FiArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSignUp}
                    className="lp-nav-link-btn w-full justify-center mt-2 py-3 flex items-center gap-2"
                  >
                    <FiUser size={16} /> Create account
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
