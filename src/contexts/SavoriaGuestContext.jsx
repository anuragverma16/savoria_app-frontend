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
    const stored = loadSavoriaSession()
    if (stored) setSession(stored)

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

  const isAuthenticated = useMemo(() => {
    if (auth?.verified || auth?.verifiedAt) return true
    return Boolean(accessToken && reduxUser)
  }, [auth, accessToken, reduxUser])

  const userDisplayName = useMemo(() => {
    if (auth?.name) return auth.name.split(/\s+/)[0]
    if (reduxUser?.name) return reduxUser.name.split(/\s+/)[0]
    if (reduxUser?.email) return reduxUser.email.split('@')[0]
    return 'Guest'
  }, [auth, reduxUser])

  const effectiveAuth = useMemo(() => {
    if (auth?.verified || auth?.verifiedAt) return auth
    if (accessToken && reduxUser) {
      return {
        verified: true,
        name: reduxUser.name,
        phone: reduxUser.phone,
        email: reduxUser.email,
        source: 'account',
      }
    }
    return null
  }, [auth, accessToken, reduxUser])

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

  const requireAuth = useCallback((redirectPath = '/order/dashboard', onSuccess) => {
    return openAuthModal({ mode: 'login', redirectPath, onSuccess })
  }, [openAuthModal])

  const completeAuth = useCallback((user, { skipSuccessCallback = false } = {}) => {
    const next = { ...user, verified: true }
    setAuth(next)
    persist({
      auth: next,
      restaurantName: next.restaurantName || loadSavoriaSession()?.restaurantName,
    })
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

  const logoutGuest = useCallback(() => {
    markSkipAuthModal()
    setAuth(null)
    patchSavoriaSession({ auth: null })
    dispatch(logoutRedux())
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
    authGateOpen,
    authGateMode,
    authGateRedirect,
    authGateLoginRole,
    setAuthGateOpen,
    setAuthGateMode,
    openAuthModal,
    closeAuthModal,
    requireAuth,
    completeAuth,
    runAuthSuccess,
    logoutGuest,
    GST_RATE: ordering.gstRate ?? GST_RATE,
    ...ordering,
  }), [
    session, refreshSession, effectiveAuth, isAuthenticated, userDisplayName,
    authGateOpen, authGateMode, authGateRedirect, authGateLoginRole, openAuthModal, closeAuthModal,
    requireAuth, completeAuth, runAuthSuccess, logoutGuest, ordering,
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
