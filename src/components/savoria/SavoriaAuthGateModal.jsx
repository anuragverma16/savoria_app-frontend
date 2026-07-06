import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import gsap from 'gsap'
import { FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { setCredentials } from '../../store/slices/authSlice'
import { hydrateTenantAfterAuth } from '../../utils/panelRole'
import { resetPageLocks } from '../../utils/resetPageLocks'
import { shouldOpenSuperAdminPanel } from '../../utils/superAdminPhone'
import { loadSavoriaSession } from '../../utils/savoriaGuestSession'
import { hasScanParams } from '../../utils/scanLink'
import { syncGuestOrderSessionAfterAuth } from '../../utils/syncGuestOrderSession'
import { formatCustomerFirstName } from '../../utils/customerDisplayName'
import BrandMark from '../dineflow/BrandMark'
import BrandLogo from '../dineflow/BrandLogo'
import SavoriaAuthPanel from './SavoriaAuthPanel'
import WhatsappOtpAuthForm from '../dineflow/WhatsappOtpAuthForm'
import { navigateAfterPanelAuth } from '../../utils/panelAuthRedirect'
import { normalizeLoginRole } from '../../utils/panelRole'

const PANEL_ROLE_LABELS = { admin: 'Admin', staff: 'Staff' }

export default function SavoriaAuthGateModal({
  open,
  mode = 'login',
  onClose,
  redirectPath,
  loginRole = 'user',
  returnTo,
}) {
  const modalRef = useRef(null)
  const overlayRef = useRef(null)
  const headerRef = useRef(null)
  const tabsRef = useRef(null)
  const contentRef = useRef(null)
  const tabIndicatorRef = useRef(null)
  const loginTabRef = useRef(null)
  const signupTabRef = useRef(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const {
    completeAuth,
    isAuthenticated,
    authGateMode,
    setAuthGateMode,
    closeAuthModal,
  } = useSavoriaGuest()
  const superAdminLoginRef = useRef(false)

  const activeMode = mode || authGateMode || 'login'
  const isSignup = activeMode === 'signup'
  const panelRole = normalizeLoginRole(loginRole)
  const isPanelLogin = panelRole === 'admin' || panelRole === 'staff'
  const panelRoleLabel = PANEL_ROLE_LABELS[panelRole] || 'User'

  const animateIn = useCallback(() => {
    const tl = gsap.timeline()
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
      .fromTo(modalRef.current,
        { scale: 0.9, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' },
        '-=0.2',
      )
      .fromTo(headerRef.current, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.35 }, '-=0.3')
    if (tabsRef.current) {
      tl.fromTo(tabsRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.2')
    }
    tl.fromTo(contentRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, '-=0.15')
    return tl
  }, [])

  useEffect(() => {
    if (!open) return
    const tl = animateIn()
    return () => tl.kill()
  }, [open, animateIn])

  useEffect(() => {
    if (!open) return
    const active = isSignup ? signupTabRef.current : loginTabRef.current
    if (!active || !tabIndicatorRef.current) return
    gsap.to(tabIndicatorRef.current, {
      x: active.offsetLeft,
      width: active.offsetWidth,
      duration: 0.35,
      ease: 'power2.inOut',
    })
  }, [open, isSignup])

  useEffect(() => {
    if (!open) return
    if (isAuthenticated && superAdminLoginRef.current) {
      onClose()
    }
  }, [open, isAuthenticated, onClose])

  const handleClose = () => {
    closeAuthModal()
    if (!modalRef.current) {
      onClose()
      return
    }
    const tl = gsap.timeline({ onComplete: onClose })
    tl.to(modalRef.current, { scale: 0.94, opacity: 0, y: 16, duration: 0.25, ease: 'power2.in' })
      .to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.15')
  }

  const handleAuthSuccess = (result) => {
    if (isPanelLogin && result?.accessToken) {
      const name = formatCustomerFirstName(result.user?.name, 'there')
      toast.success(`Welcome, ${name}!`)
      closeAuthModal()
      onClose()
      navigateAfterPanelAuth({
        user: result.user,
        memberships: result.memberships,
        loginRole: panelRole,
        from: returnTo,
        dispatch,
        navigate,
        isSuperAdminFlag: Boolean(result.isSuperAdmin),
      })
      return
    }
    applyAuthResult(result)
  }

  const applyAuthResult = async (result) => {
    const authPayload = result?.accessToken ? result : null
    const user = authPayload?.user || result
    const phoneHint = result?.phone || user?.phone
    const savoriaSession = loadSavoriaSession()
    const onOrderPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/order')
    const inQrTableOrder = Boolean(
      savoriaSession?.scanLocked
      && savoriaSession?.qrLinked
      && onOrderPath
      && (hasScanParams(new URLSearchParams(window.location.search)) || window.location.pathname.includes('/order/menu')),
    )
    let openSuperAdmin = Boolean(result?.isSuperAdmin)
      || shouldOpenSuperAdminPanel(user, phoneHint)
    if (inQrTableOrder) openSuperAdmin = false

    const scannedRid = savoriaSession?.rid

    superAdminLoginRef.current = openSuperAdmin

    if (authPayload?.accessToken) {
      const apiUser = openSuperAdmin
        ? { ...authPayload.user, platformRole: 'superadmin', role: 'superadmin' }
        : authPayload.user

      dispatch(setCredentials({
        user: apiUser,
        accessToken: authPayload.accessToken,
        refreshToken: authPayload.refreshToken,
        memberships: authPayload.memberships,
      }))

      if (openSuperAdmin) {
        hydrateTenantAfterAuth(dispatch, {
          user: apiUser,
          memberships: authPayload.memberships,
          loginRole: 'superadmin',
        }, 'superadmin')
      } else if (apiUser.role === 'staff' || apiUser.role === 'admin') {
        hydrateTenantAfterAuth(dispatch, {
          user: apiUser,
          memberships: authPayload.memberships,
          loginRole: apiUser.role,
        }, apiUser.role)
      } else {
        hydrateTenantAfterAuth(dispatch, {
          user: apiUser,
          memberships: authPayload.memberships,
          loginRole: 'user',
          preferredRestaurantId: scannedRid,
        }, 'user')
        await syncGuestOrderSessionAfterAuth(dispatch, {
          user: apiUser,
          memberships: authPayload.memberships,
        })
      }
    }

    const firstName = formatCustomerFirstName(user?.name, 'there')
    const panelRole = authPayload?.user?.role

    if (authPayload?.accessToken && (panelRole === 'staff' || panelRole === 'admin')) {
      toast.success(`Welcome, ${firstName}!`)
      closeAuthModal()
      onClose()
      navigateAfterPanelAuth({
        user: authPayload.user,
        memberships: authPayload.memberships,
        loginRole: panelRole,
        from: returnTo,
        dispatch,
        navigate,
      })
      return
    }

    completeAuth({
      name: user?.name,
      phone: user?.phone || phoneHint,
      email: user?.email,
      restaurantName: user?.restaurant?.name || authPayload?.memberships?.[0]?.restaurant?.name,
      verified: true,
    }, { skipSuccessCallback: openSuperAdmin })

    toast.success(`Welcome, ${firstName}!`)
    closeAuthModal()
    onClose()

    if (openSuperAdmin && !inQrTableOrder) {
      resetPageLocks()
      navigate('/platform', { replace: true })
      return
    }

    if (redirectPath && redirectPath.startsWith('/order')) {
      navigate(redirectPath, { replace: true })
      return
    }
    if (redirectPath && !redirectPath.startsWith('/order')) {
      navigate(redirectPath)
      return
    }
    if (panelRole === 'user' || !authPayload?.accessToken) {
      navigate(redirectPath || '/order/dashboard', { replace: true })
    }
  }

  const switchMode = (next) => {
    if (next === activeMode) return
    setAuthGateMode(next)
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' },
      )
    }
  }

  if (!open) return null

  return (
    <>
      <div ref={overlayRef} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md" aria-hidden />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={modalRef}
          className="sv-auth-modal pointer-events-auto w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-2xl shadow-emerald-500/10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative px-5 sm:px-7 pt-5 pb-5 sm:pb-6">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
              aria-label="Close"
            >
              <FiX size={17} />
            </button>

            <div ref={headerRef} className="sv-auth-modal-header">
              <BrandMark size="sm" />
              <div className="min-w-0">
                <BrandLogo className="text-lg text-white leading-none" accentClass="text-emerald-400" />
                <h2 className="text-base font-bold text-white mt-1">
                  {isPanelLogin
                    ? `${panelRoleLabel} sign in`
                    : (isSignup ? 'Sign up' : 'Login')}
                </h2>
              </div>
            </div>

            {!isPanelLogin && (
            <div ref={tabsRef} className="sv-auth-tabs">
              <button
                ref={loginTabRef}
                type="button"
                onClick={() => switchMode('login')}
                className={`sv-auth-tab ${!isSignup ? 'is-active' : ''}`}
              >
                Login
              </button>
              <button
                ref={signupTabRef}
                type="button"
                onClick={() => switchMode('signup')}
                className={`sv-auth-tab ${isSignup ? 'is-active' : ''}`}
              >
                Sign up
              </button>
              <div ref={tabIndicatorRef} className="sv-auth-tab-indicator" style={{ width: '50%' }} />
            </div>
            )}

            <div ref={contentRef} key={isPanelLogin ? `panel-${panelRole}` : activeMode}>
              {isPanelLogin ? (
                <div className="sv-auth-box sv-auth-box--user pt-2">
                  <p className="text-white/60 text-sm mb-4">
                    Sign in with WhatsApp OTP — enter the 6-digit code sent to your mobile.
                  </p>
                  <WhatsappOtpAuthForm
                    mode="login"
                    loginRole={panelRole}
                    onSuccess={handleAuthSuccess}
                    dispatchCredentials
                  />
                </div>
              ) : (
                <SavoriaAuthPanel mode={activeMode} onSuccess={handleAuthSuccess} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
