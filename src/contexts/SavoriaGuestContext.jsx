import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout as logoutRedux } from '../store/slices/authSlice'
import {
  initSavoriaSessionFromParams,
  loadSavoriaSession,
  patchSavoriaSession,
} from '../utils/savoriaGuestSession'
import { markSkipAuthModal } from '../utils/authEntry'
import { useCustomerOrdering } from '../hooks/useCustomerOrdering'
import { isGuestQrOrderFlow, isQrTableSession } from '../utils/scanLink'
import { formatCustomerFullName, isPlaceholderCustomerName, resolveCustomerDisplayName, resolveCustomerPhone } from '../utils/customerDisplayName'
import {
  getStoredPanelAuth,
  shouldPreservePanelAuthDuringQrOrder,
} from '../utils/panelAuthPreserve'

const SavoriaGuestContext = createContext(null)

export const GST_RATE = 5

/** Auth + customer ordering for public QR flow */
export function SavoriaGuestProvider({ children }) {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { user: reduxUser, accessToken } = useSelector((s) => s.auth)
  const [session, setSession] = useState(() => loadSavoriaSession() || {})
  const [auth, setAuth] = useState(() => loadSavoriaSession()?.auth || null)
  const [authGateOpen, setAuthGateOpen] = useState(false)
  const [authGateMode, setAuthGateMode] = useState('login')
  const [authGateRedirect, setAuthGateRedirect] = useState('/order/dashboard')
  const [authGateLoginRole, setAuthGateLoginRole] = useState('user')
  const authSuccessRef = useRef(null)

  useEffect(() => {
    const next = initSavoriaSessionFromParams(searchParams)
    setSession(next)
    if (next.auth) setAuth(next.auth)
  }, [searchParams])

  useEffect(() => {
    let stored = loadSavoriaSession()
    if (stored) setSession(stored)

    if (stored?.auth?.name && isPlaceholderCustomerName(stored.auth.name)) {
      const cleaned = { ...stored.auth }
      delete cleaned.name
      stored = patchSavoriaSession({ auth: cleaned })
      setSession(stored)
    }

    if (accessToken && reduxUser) {
      if (stored?.auth) setAuth(stored.auth)
      return
    }

    const guestAuth = stored?.auth
    if (!accessToken && (guestAuth?.verified || guestAuth?.verifiedAt)) {
      setAuth(guestAuth)
      return
    }

    setAuth(null)
  }, [location.pathname, location.search, accessToken, reduxUser])

  const persist = useCallback((patch) => {
    const next = patchSavoriaSession(patch)
    setSession(next)
    return next
  }, [])

  const refreshSession = useCallback(() => {
    const next = loadSavoriaSession() || {}
    setSession(next)
    if (next.auth) setAuth(next.auth)
    return next
  }, [])

  const isQrTableFlow = useMemo(
    () => isGuestQrOrderFlow(searchParams, location.pathname) && isQrTableSession(session),
    [searchParams, location.pathname, session],
  )

  const hasOrderCustomerAuth = Boolean(
    auth?.verified || auth?.verifiedAt || session?.orderCustomerAuth,
  )

  const isAuthenticated = useMemo(() => {
    if (isQrTableFlow && !hasOrderCustomerAuth) return false
    if (auth?.verified || auth?.verifiedAt) return true
    if (isQrTableFlow) return false
    return Boolean(accessToken && reduxUser)
  }, [auth, accessToken, reduxUser, isQrTableFlow, hasOrderCustomerAuth])

  const panelLoggedIn = useMemo(
    () => shouldPreservePanelAuthDuringQrOrder(getStoredPanelAuth()),
    [accessToken, reduxUser, session?.orderCustomerAuth, auth],
  )

  const customerOnlyIdentity = Boolean(
    hasOrderCustomerAuth && (isQrTableFlow || panelLoggedIn),
  )

  const userDisplayName = useMemo(() => {
    if (isQrTableFlow && !hasOrderCustomerAuth) return 'Guest'
    if (customerOnlyIdentity) {
      return resolveCustomerDisplayName(auth?.name) || ''
    }
    const signedIn = Boolean(auth?.verified || auth?.verifiedAt || (accessToken && reduxUser))
    const resolved = resolveCustomerDisplayName(auth?.name, reduxUser?.name)
    return resolved || (signedIn ? '' : 'Guest')
  }, [auth, reduxUser, accessToken, isQrTableFlow, hasOrderCustomerAuth, customerOnlyIdentity])

  const userPhone = useMemo(() => {
    if (isQrTableFlow && !hasOrderCustomerAuth) return ''
    if (customerOnlyIdentity) {
      return resolveCustomerPhone(auth?.phone) || ''
    }
    if (auth?.phone) return auth.phone
    if (!isQrTableFlow && reduxUser?.phone) return reduxUser.phone
    return ''
  }, [auth, reduxUser, isQrTableFlow, hasOrderCustomerAuth, customerOnlyIdentity])

  const effectiveAuth = useMemo(() => {
    if (isQrTableFlow && !hasOrderCustomerAuth) return null
    if (auth?.verified || auth?.verifiedAt) return auth
    if (isQrTableFlow) return null
    if (accessToken && reduxUser) {
      return {
        verified: true,
        name: formatCustomerFullName(reduxUser.name, ''),
        phone: reduxUser.phone,
        email: reduxUser.email,
        source: 'account',
      }
    }
    return null
  }, [auth, accessToken, reduxUser, isQrTableFlow, hasOrderCustomerAuth])

  const ordering = useCustomerOrdering({
    session,
    refreshSession,
    isAuthenticated,
  })

  const openAuthModal = useCallback(({
    mode = 'login',
    redirectPath = '/order/dashboard',
    loginRole = 'user',
    onSuccess,
  } = {}) => {
    if (isAuthenticated) {
      onSuccess?.()
      return true
    }
    authSuccessRef.current = onSuccess || null
    setAuthGateMode(mode)
    setAuthGateRedirect(redirectPath)
    setAuthGateLoginRole(loginRole || 'user')
    setAuthGateOpen(true)
    return false
  }, [isAuthenticated])

  const closeAuthModal = useCallback(() => {
    setAuthGateOpen(false)
    setAuthGateLoginRole('user')
    setAuthGateMode('login')
    authSuccessRef.current = null
  }, [])

  const requireAuth = useCallback((redirectPath = '/order/dashboard', options = {}) => {
    const opts = typeof options === 'function'
      ? { onSuccess: options }
      : options
    return openAuthModal({
      mode: opts.mode || 'login',
      redirectPath,
      onSuccess: opts.onSuccess,
    })
  }, [openAuthModal])

  const requirePaymentAuth = useCallback((redirectPath) => {
    return openAuthModal({ mode: 'login', redirectPath })
  }, [openAuthModal])

  const completeAuth = useCallback((user, { skipSuccessCallback = false, customerTokens } = {}) => {
    const cleanName = formatCustomerFullName(user?.name, '')
    const next = {
      ...user,
      name: cleanName || undefined,
      verified: true,
    }
    if (next.name && isPlaceholderCustomerName(next.name)) delete next.name
    setAuth(next)
    const persistPatch = {
      auth: next,
      orderCustomerAuth: true,
      restaurantName: next.restaurantName || loadSavoriaSession()?.restaurantName,
    }
    if (customerTokens?.accessToken) {
      persistPatch.customerTokens = customerTokens
    }
    persist(persistPatch)
    setAuthGateOpen(false)
    if (skipSuccessCallback) {
      authSuccessRef.current = null
      return
    }
    const cb = authSuccessRef.current
    authSuccessRef.current = null
    cb?.()
  }, [persist])

  const runAuthSuccess = useCallback(() => {
    const cb = authSuccessRef.current
    authSuccessRef.current = null
    cb?.()
  }, [])

  const logoutGuest = useCallback(({ full = false } = {}) => {
    markSkipAuthModal()
    const keepPanel = !full && shouldPreservePanelAuthDuringQrOrder(getStoredPanelAuth())

    setAuth(null)
    patchSavoriaSession({
      auth: null,
      orderCustomerAuth: false,
      customerTokens: null,
    })
    if (!keepPanel) {
      dispatch(logoutRedux())
    }
    authSuccessRef.current = null
    setAuthGateOpen(false)
    setAuthGateLoginRole('user')
    setAuthGateMode('login')
  }, [dispatch])

  const value = useMemo(() => ({
    session,
    refreshSession,
    auth: effectiveAuth,
    isAuthenticated,
    userDisplayName,
    userPhone,
    isQrTableFlow,
    hasOrderCustomerAuth,
    authGateOpen,
    authGateMode,
    authGateRedirect,
    authGateLoginRole,
    setAuthGateOpen,
    setAuthGateMode,
    openAuthModal,
    closeAuthModal,
    requireAuth,
    requirePaymentAuth,
    completeAuth,
    runAuthSuccess,
    logoutGuest,
    GST_RATE: ordering.gstRate ?? GST_RATE,
    ...ordering,
  }), [
    session, refreshSession, effectiveAuth, isAuthenticated, userDisplayName, userPhone, isQrTableFlow,
    authGateOpen, authGateMode, authGateRedirect, authGateLoginRole, openAuthModal, closeAuthModal,
    requireAuth, completeAuth, runAuthSuccess, logoutGuest, requirePaymentAuth, ordering,
  ])

  return (
    <SavoriaGuestContext.Provider value={value}>
      {children}
    </SavoriaGuestContext.Provider>
  )
}

export function useSavoriaGuest() {
  const ctx = useContext(SavoriaGuestContext)
  if (!ctx) throw new Error('useSavoriaGuest must be used within SavoriaGuestProvider')
  return ctx
}

export function useSavoriaGuestOptional() {
  return useContext(SavoriaGuestContext)
}
