import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiArrowRight, FiEye, FiEyeOff, FiArrowLeft, FiZap, FiUsers, FiBarChart2 } from 'react-icons/fi'
import {
  loginUser,
  registerUser,
  resetAuthLoading,
  hydrateTenantAfterAuth,
} from '../../store/slices/authSlice'
import { getRedirectAfterLogin, resolveRestaurantForUser } from '../../utils/panelRole'
import { resetPageLocks } from '../../utils/resetPageLocks'
import { useAuthPageGsap, shakeAuthPanel, exitAuthPage } from '../../hooks/useAuthPageGsap'
import BrandMark from '../../components/dineflow/BrandMark'
import BrandLogo from '../../components/dineflow/BrandLogo'
import toast from 'react-hot-toast'

const HERO_CHIPS = [
  { icon: FiZap, label: 'Live orders', color: 'text-amber-400' },
  { icon: FiUsers, label: 'Team panels', color: 'text-orange-400' },
  { icon: FiBarChart2, label: 'Analytics', color: 'text-green-400' },
]

function redirectPath(user, memberships, loginRole) {
  if (user?.platformRole === 'superadmin' || user?.role === 'superadmin') {
    return '/platform'
  }
  const { membership } = resolveRestaurantForUser(user, memberships, loginRole)
  return getRedirectAfterLogin(user, membership || { restaurant: user?.restaurant })
}

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [mode, setMode] = useState(() => (searchParams.get('mode') === 'signup' ? 'signup' : 'login'))
  const [role, setRole] = useState('user')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', restaurantName: '' })

  const pageRef = useRef(null)
  const panelRef = useRef(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector((s) => s.auth.loading)
  const { formRef } = useAuthPageGsap(pageRef, mode)

  const isSignup = mode === 'signup'
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  useLayoutEffect(() => {
    resetPageLocks()
    document.body.classList.add('auth-page-active')
    return () => document.body.classList.remove('auth-page-active')
  }, [])

  useEffect(() => {
    document.title = isSignup ? 'Sign up — Savoria' : 'Sign in — Savoria'
  }, [isSignup])

  useEffect(() => {
    setMode(searchParams.get('mode') === 'signup' ? 'signup' : 'login')
  }, [searchParams])

  const fail = (text) => {
    setError(text)
    toast.error(text)
    shakeAuthPanel(panelRef.current)
  }

  const goDashboard = (path) => {
    exitAuthPage(pageRef, () => navigate(path, { replace: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const email = form.email.trim().toLowerCase()
    const password = form.password
    if (!email || !password) {
      fail('Email and password are required.')
      return
    }

    try {
      if (isSignup) {
        if (!form.name.trim() || !form.restaurantName.trim()) {
          fail('Name and restaurant name are required.')
          return
        }
        const result = await dispatch(registerUser({
          name: form.name.trim(),
          email,
          password,
          role: 'user',
          restaurantName: form.restaurantName.trim(),
        })).unwrap()

        hydrateTenantAfterAuth(dispatch, {
          user: result.user,
          memberships: result.memberships,
          loginRole: 'user',
        }, 'user')

        const path = redirectPath(result.user, result.memberships, 'user')
        toast.success('Welcome to Savoria!')
        if (path) goDashboard(path)
        return
      }

      const result = await dispatch(loginUser({ email, password, role })).unwrap()
      hydrateTenantAfterAuth(dispatch, {
        user: result.user,
        memberships: result.memberships,
        loginRole: role,
      }, role)

      const path = redirectPath(result.user, result.memberships, role)
      if (!path) {
        fail(role === 'admin' ? 'No admin access. Try the User tab.' : 'No access for this role.')
        return
      }

      const from = location.state?.from
      const dest = from?.pathname ? `${from.pathname}${from.search || ''}` : path
      toast.success(`Welcome back, ${result.user?.name?.split(' ')[0] || 'there'}!`)
      goDashboard(dest)
    } catch (err) {
      fail(typeof err === 'string' ? err : err?.message || 'Sign in failed.')
    } finally {
      dispatch(resetAuthLoading())
    }
  }

  return (
    <div ref={pageRef} className="auth-page">
      <div className="auth-hero-side relative hidden lg:flex lg:w-[52%] flex-col justify-between overflow-hidden p-12 xl:p-16">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-orb auth-orb--3" />

        <Link to="/" className="auth-flow-item relative z-10 inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold">
          <FiArrowLeft /> Back to home
        </Link>

        <div className="relative z-10 max-w-lg">
          <div className="auth-hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm mb-8">
            <BrandMark size="sm" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Savoria SaaS</span>
          </div>

          <h1 className="auth-hero-title text-white mb-6">
            <span className="block text-4xl xl:text-5xl font-bold leading-tight">Run your restaurant</span>
            <span className="block text-4xl xl:text-5xl font-bold leading-tight mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400">
              from one beautiful hub
            </span>
          </h1>

          <p className="auth-hero-copy text-lg text-white/65 leading-relaxed">
            {isSignup
              ? 'Create your customer account — order, book tables, and track visits.'
              : 'Sign in as admin or user to open your live dashboard.'}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {HERO_CHIPS.map(({ icon: Icon, label, color }) => (
              <div key={label} className="auth-hero-chip flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5">
                <Icon className={color} size={16} />
                <span className="text-sm font-medium text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="auth-flow-item relative z-10 text-white/35 text-xs">© {new Date().getFullYear()} Savoria</p>
      </div>

      <div className="auth-form-panel flex flex-1 flex-col min-h-dvh w-full bg-white">
        <header className="auth-flow-item flex items-center justify-between border-b border-slate-100 px-6 py-4 lg:px-10">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600">
            <FiArrowLeft /> Home
          </Link>
          <div className="flex items-center gap-2 mx-auto lg:mx-0">
            <BrandMark size="sm" />
            <BrandLogo className="text-lg" />
          </div>
          <div className="w-16 lg:hidden" />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
          <div ref={panelRef} className="w-full max-w-md">
            <div ref={formRef} key={mode}>
              <div className="auth-flow-item">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {isSignup ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {isSignup ? 'User sign up only' : 'Admin or User sign in'}
                </p>
              </div>

              <div className="auth-flow-item mt-8 flex rounded-2xl bg-slate-100 p-1.5">
                {['login', 'signup'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError('') }}
                    className={`flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${
                      mode === m ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500'
                    }`}
                  >
                    {m === 'login' ? 'Sign in' : 'Sign up'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="auth-flow-item mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!isSignup && (
                <div className="auth-flow-item mt-6 grid grid-cols-2 gap-3">
                  {[
                    { id: 'admin', label: 'Admin' },
                    { id: 'user', label: 'User' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setRole(r.id); setError('') }}
                      className={`rounded-2xl border-2 py-3 text-sm font-bold transition-all ${
                        role === r.id
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {isSignup && (
                  <input className="auth-flow-item df-input" placeholder="Full name" value={form.name} onChange={set('name')} />
                )}
                <input type="email" className="auth-flow-item df-input" placeholder="Email" value={form.email} onChange={set('email')} required />
                <div className="auth-flow-item relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="df-input pr-11"
                    placeholder="Password"
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                  <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPass((v) => !v)}>
                    {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {isSignup && (
                  <input className="auth-flow-item df-input" placeholder="Restaurant name" value={form.restaurantName} onChange={set('restaurantName')} />
                )}
                <button type="submit" disabled={loading} className="auth-flow-item df-btn-primary w-full py-4 text-base disabled:opacity-60">
                  {loading ? 'Please wait…' : (
                    <span className="inline-flex items-center justify-center gap-2">
                      {isSignup ? 'Create account' : `Sign in as ${role}`}
                      <FiArrowRight />
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
