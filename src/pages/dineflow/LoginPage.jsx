import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import gsap from 'gsap'
import {
  FiGrid, FiUsers, FiUser,
  FiMaximize2, FiZap, FiBarChart2, FiCheck,
} from 'react-icons/fi'
import WhatsappOtpAuthForm from '../../components/dineflow/WhatsappOtpAuthForm'
import { getRedirectAfterLogin, hydrateTenantAfterAuth, normalizeLoginRole, shouldBlockSuspendedRestaurant, RESTAURANT_SUSPENDED_MESSAGE } from '../../utils/panelRole'
import { resetPageLocks } from '../../utils/resetPageLocks'
import ThemeToggle from '../../components/dineflow/ThemeToggle'
import BrandLogo from '../../components/dineflow/BrandLogo'
import BrandMark from '../../components/dineflow/BrandMark'
import toast from 'react-hot-toast'

const LOGIN_ROLES = [
  { id: 'admin', label: 'Admin', icon: FiGrid, color: '#3b82f6' },
  { id: 'staff', label: 'Staff', icon: FiUsers, color: '#22c55e' },
  { id: 'user', label: 'User', icon: FiUser, color: '#f97316' },
]

const HIGHLIGHTS = [
  { icon: FiMaximize2, text: 'QR table ordering', color: 'text-orange-400' },
  { icon: FiZap, text: 'Live kitchen sync', color: 'text-green-400' },
  { icon: FiBarChart2, text: 'Real-time analytics', color: 'text-blue-400' },
]

const ROLE_PLACEHOLDER_NAMES = /^(staff|admin|user|superadmin|manager|waiter|chef|cashier|customer|custom)$/i

function welcomeMessage(user) {
  const fullName = String(user?.name ?? '').trim()
  const emailPart = String(user?.email ?? '').split('@')[0]?.trim() || ''

  let display = ''
  if (fullName && !ROLE_PLACEHOLDER_NAMES.test(fullName)) {
    display = fullName.split(/\s+/)[0]
  } else if (emailPart) {
    display = emailPart.replace(/[._-]+/g, ' ').split(/\s+/)[0]
  }

  if (!display) return 'Welcome back!'
  return `Welcome, ${display.charAt(0).toUpperCase()}${display.slice(1)}`
}

export default function DineFlowLogin() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState(() => normalizeLoginRole(searchParams.get('role')))

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading } = useSelector((s) => s.auth)

  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const formPanelRef = useRef(null)
  const formCardRef = useRef(null)
  const fieldsRef = useRef(null)
  const rolesRef = useRef(null)
  const tabIndicatorRef = useRef(null)
  const loginTabRef = useRef(null)
  const signupTabRef = useRef(null)
  const orbRefs = useRef([])
  const skipFieldAnim = useRef(true)

  const resolvedRole = normalizeLoginRole(role)
  const showSignup = resolvedRole === 'user'
  const showRolePicker = !(showSignup && mode === 'signup')
  const isCustomerSignup = showSignup && mode === 'signup'
  const otpLoginRole = resolvedRole === 'admin' || resolvedRole === 'staff' ? resolvedRole : undefined

  useEffect(() => {
    if (searchParams.get('role') === 'superadmin') {
      navigate('/', { replace: true, state: { openAuth: true, from: { pathname: '/platform' } } })
      return
    }
    const q = searchParams.get('role')
    if (q) setRole(normalizeLoginRole(q))
    if (searchParams.get('mode') === 'signup') setMode('signup')
  }, [searchParams, navigate])

  const handleModeChange = (m) => {
    if (m === mode) return
    setMode(m)
    if (m === 'signup') setRole('user')
  }

  const redirect = (user, memberships, loginRole) => {
    if (user.platformRole === 'superadmin' || user.role === 'superadmin') {
      hydrateTenantAfterAuth(dispatch, { user, memberships, loginRole: 'superadmin' }, 'superadmin')
      resetPageLocks()
      navigate('/platform', { replace: true })
      return
    }

    const { membership, restaurant } = hydrateTenantAfterAuth(
      dispatch,
      { user, memberships, loginRole },
      loginRole,
    )

    const targetRestaurant = restaurant || membership?.restaurant || user?.restaurant
    if (shouldBlockSuspendedRestaurant(user, targetRestaurant)) {
      toast.error(RESTAURANT_SUSPENDED_MESSAGE)
      navigate('/restaurant-suspended', {
        replace: true,
        state: { restaurantName: targetRestaurant?.name },
      })
      return
    }

    const path = getRedirectAfterLogin(user, membership || { restaurant: targetRestaurant })
    if (!path) {
      toast.error('Could not open your panel. Check your account role and restaurant access.')
      return
    }

    const from = location.state?.from
    if (from?.pathname && user.role === 'user' && (
      /\/user\/(tables|scan|menu)/.test(from.pathname)
      || from.pathname === '/book-table'
      || from.pathname === '/scan-table'
      || from.pathname.startsWith('/order')
    )) {
      resetPageLocks()
      const target = from.pathname.startsWith('/order/cart') || from.pathname.startsWith('/order/checkout')
        ? `${from.pathname}${from.search || ''}`
        : `${from.pathname}${from.search || '?scan=1'}`
      navigate(target, { replace: true })
      return
    }

    resetPageLocks()
    navigate(path, { replace: true })
  }

  const handleOtpAuthSuccess = (result, loginRole) => {
    toast.success(welcomeMessage(result.user))
    redirect(result.user, result.memberships, loginRole || 'user')
  }

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from(heroRef.current, { x: -60, opacity: 0, duration: 0.9 })
        .from('.df-login-hero-badge', { y: 20, opacity: 0, duration: 0.5 }, '-=0.5')
        .from('.df-login-hero-title', { y: 40, opacity: 0, duration: 0.7 }, '-=0.3')
        .from('.df-login-hero-line', { scaleX: 0, duration: 0.6, transformOrigin: 'left' }, '-=0.4')
        .from('.df-login-highlight', { x: -24, opacity: 0, stagger: 0.12, duration: 0.5 }, '-=0.2')

      tl.from(formPanelRef.current, { x: 60, opacity: 0, duration: 0.8 }, '-=0.9')
        .from(formCardRef.current, { y: 30, opacity: 0, duration: 0.6 }, '-=0.5')
        .from('.df-login-form-head', { y: 16, opacity: 0, duration: 0.4 }, '-=0.3')
        .from('.df-login-tab-btn', { y: 10, opacity: 0, stagger: 0.08, duration: 0.35 }, '-=0.2')
        .from('.df-login-role', { scale: 0.85, opacity: 0, stagger: 0.06, duration: 0.4, clearProps: 'opacity,transform' }, '-=0.15')
        .from('.df-login-input-wrap', { y: 16, opacity: 0, stagger: 0.07, duration: 0.45, clearProps: 'opacity,transform' }, '-=0.1')
        .from('.df-login-submit', { y: 12, opacity: 0, duration: 0.4, clearProps: 'opacity,transform' }, '-=0.2')
        .add(() => {
          if (loginTabRef.current && tabIndicatorRef.current) {
            gsap.set(tabIndicatorRef.current, {
              x: loginTabRef.current.offsetLeft,
              width: loginTabRef.current.offsetWidth,
            })
          }
        })

      orbRefs.current.forEach((orb, i) => {
        if (!orb) return
        gsap.to(orb, {
          x: `random(-30, 30)`,
          y: `random(-40, 40)`,
          scale: `random(0.9, 1.15)`,
          duration: 4 + i,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })
    }, pageRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!showSignup) return
    const active = mode === 'login' ? loginTabRef.current : signupTabRef.current
    if (!active || !tabIndicatorRef.current) return
    gsap.to(tabIndicatorRef.current, {
      x: active.offsetLeft,
      width: active.offsetWidth,
      duration: 0.35,
      ease: 'power2.inOut',
    })
  }, [mode, showSignup])

  useEffect(() => {
    if (skipFieldAnim.current) {
      skipFieldAnim.current = false
      return
    }
    if (!fieldsRef.current) return
    gsap.fromTo(
      fieldsRef.current.children,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' },
    )
  }, [mode, role])

  const selectRole = (id) => {
    if (role === id) return
    if (id !== 'user' && mode === 'signup') setMode('login')
    setRole(id)
    const el = rolesRef.current?.querySelector(`[data-role="${id}"]`)
    if (el) {
      gsap.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' })
    }
  }

  return (
    <div ref={pageRef} className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-white">
      <div
        ref={heroRef}
        className="df-login-hero relative hidden lg:flex lg:w-[48%] xl:w-[52%] flex-col justify-between p-12 xl:p-16 overflow-hidden"
      >
        <div ref={(el) => { orbRefs.current[0] = el }} className="df-login-orb w-72 h-72 bg-orange-500/30 top-[-5%] right-[10%]" />
        <div ref={(el) => { orbRefs.current[1] = el }} className="df-login-orb w-56 h-56 bg-blue-500/25 bottom-[20%] left-[-5%]" />
        <div ref={(el) => { orbRefs.current[2] = el }} className="df-login-orb w-40 h-40 bg-green-500/20 top-[45%] right-[25%]" />

        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit text-white">
          <BrandMark size="md" />
          <BrandLogo className="text-xl" accentClass="text-orange-400" />
        </Link>

        <div className="relative z-10 max-w-lg">
          <div className="df-login-hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">
              Savoria Platform
            </span>
          </div>
          <h1 className="df-login-hero-title text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Welcome back to
            <span className="block text-orange-400 mt-1">smarter dining</span>
          </h1>
          <div className="df-login-hero-line h-1 w-24 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500 rounded-full mb-10" />
          <ul className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="df-login-highlight flex items-center gap-3 text-white/70">
                <span className={`w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center ${h.color}`}>
                  <h.icon size={18} />
                </span>
                <span className="text-sm font-medium">{h.text}</span>
                <FiCheck className="ml-auto text-green-400 opacity-60" size={14} />
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Savoria SaaS
        </p>
      </div>

      <div ref={formPanelRef} className="flex-1 flex flex-col min-h-screen bg-white">
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="df-logo text-sm">🍽</div>
            <BrandLogo className="text-base" />
          </Link>
          <Link to="/" className="hidden lg:block text-sm text-slate-500 hover:text-[var(--df-accent)] transition-colors">
            ← Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div ref={formCardRef} className="w-full max-w-md">
            <div className="df-login-form-head mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {isCustomerSignup ? 'Create account' : 'Sign in with WhatsApp'}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                A 6-digit WhatsApp code is required — you cannot sign in without verifying OTP.
              </p>
            </div>

            {showSignup && (
            <div className="df-login-tab flex border-b border-slate-200 mb-8 relative">
              <button
                ref={loginTabRef}
                type="button"
                onClick={() => handleModeChange('login')}
                className={`df-login-tab-btn flex-1 pb-3 text-sm font-semibold transition-colors ${
                  mode === 'login' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Login
              </button>
              <button
                ref={signupTabRef}
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`df-login-tab-btn flex-1 pb-3 text-sm font-semibold transition-colors ${
                  mode === 'signup' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign Up
              </button>
              <div ref={tabIndicatorRef} className="df-login-tab-indicator" style={{ width: '50%' }} />
            </div>
            )}

            {showRolePicker && (
            <div ref={rolesRef} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {LOGIN_ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  data-role={r.id}
                  onClick={() => selectRole(r.id)}
                  className={`df-login-role flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 ${
                    resolvedRole === r.id ? 'is-active bg-white' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                  style={resolvedRole === r.id ? { borderColor: r.color, boxShadow: `0 8px 24px ${r.color}22` } : {}}
                >
                  <r.icon size={18} style={{ color: resolvedRole === r.id ? r.color : '#94a3b8' }} />
                  <span className={`text-[10px] font-semibold text-center leading-tight ${resolvedRole === r.id ? 'text-slate-800' : 'text-slate-400'}`}>
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
            )}

            <div ref={fieldsRef}>
              <WhatsappOtpAuthForm
                mode={isCustomerSignup ? 'signup' : 'login'}
                loginRole={otpLoginRole}
                onSuccess={handleOtpAuthSuccess}
                loading={loading}
              />
            </div>

            <p className="text-center text-slate-400 text-xs mt-8">
              {mode === 'login' && showSignup ? (
                <>No account? <button type="button" onClick={() => handleModeChange('signup')} className="text-[var(--df-accent)] font-semibold hover:underline">Sign up as User</button></>
              ) : showSignup ? (
                <>Have an account? <button type="button" onClick={() => handleModeChange('login')} className="text-[var(--df-accent)] font-semibold hover:underline">Sign in</button></>
              ) : (
                <Link to="/" className="text-[var(--df-accent)] font-semibold hover:underline">← Back to home</Link>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
