import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout as logoutRedux } from '../store/slices/authSlice'
import {
  initSavoriaSessionFromParams,
  loadSavoriaSession,
  patchSavoriaSession,
} from '../utils/savoriaGuestSession'
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
  const authSuccessRef = useRef(null)

  useEffect(() => {
    const next = initSavoriaSessionFromParams(searchParams)
    setSession(next)
    if (next.auth) setAuth(next.auth)
  }, [searchParams])

  useEffect(() => {
    const stored = loadSavoriaSession()?.auth
    if (stored?.verified || stored?.verifiedAt) {
      setAuth(stored)
    }
  }, [location.pathname])

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
    onSuccess,
  } = {}) => {
    if (isAuthenticated) {
      onSuccess?.()
      return true
    }
    authSuccessRef.current = onSuccess || null
    setAuthGateMode(mode)
    setAuthGateRedirect(redirectPath)
    setAuthGateOpen(true)
    return false
  }, [isAuthenticated])

  const closeAuthModal = useCallback(() => {
    setAuthGateOpen(false)
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
    setAuth(null)
    patchSavoriaSession({ auth: null })
    if (accessToken) dispatch(logoutRedux())
    authSuccessRef.current = null
    setAuthGateOpen(false)
  }, [accessToken, dispatch])

  const value = useMemo(() => ({
    session,
    refreshSession,
    auth: effectiveAuth,
    isAuthenticated,
    userDisplayName,
    authGateOpen,
    authGateMode,
    authGateRedirect,
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
    authGateOpen, authGateMode, authGateRedirect, openAuthModal, closeAuthModal,
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
