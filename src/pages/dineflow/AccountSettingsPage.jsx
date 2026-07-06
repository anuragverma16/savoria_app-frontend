import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiMail, FiPhone, FiSave, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/dineflow'
import ThemeToggle from '../../components/dineflow/ThemeToggle'
import OrderPanelActionBar from '../../components/savoria/OrderPanelActionBar'
import { useSavoriaGuestOptional } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import { loadSavoriaSession, patchSavoriaSession } from '../../utils/savoriaGuestSession'
import { getNavbarDashboardPath, isSuperAdminUser } from '../../utils/panelRole'
import { shouldOpenSuperAdminPanel } from '../../utils/superAdminPhone'
import { setCredentials } from '../../store/slices/authSlice'
import { formatCustomerFullName, isPlaceholderCustomerName } from '../../utils/customerDisplayName'

function roleLabel(user, guestName) {
  if (shouldOpenSuperAdminPanel(user, user?.phone)) return 'Super Admin'
  if (user?.role === 'admin' || user?.platformRole === 'admin') return 'Restaurant Admin'
  if (user?.role === 'staff' || user?.platformRole === 'staff') return 'Staff'
  if (guestName || user?.role === 'user') return 'Customer'
  return user?.role || 'Account'
}

export default function AccountSettingsPage({ variant = 'default' }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const { withQuery } = useOrderPanelQuery()
  const { user, memberships, accessToken, refreshToken } = useSelector((s) => s.auth)
  const guest = useSavoriaGuestOptional()
  const savoriaAuth = loadSavoriaSession()?.auth
  const isOrderPanel = location.pathname.startsWith('/order')
  const isGuestOnOrder = isOrderPanel && !guest?.isAuthenticated

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const hasAccount = Boolean(accessToken && user)
  const displayRole = roleLabel(user, guest?.auth?.name || savoriaAuth?.name)
  const dashboardPath = user
    ? getNavbarDashboardPath(user, memberships, phone)
    : '/order/dashboard'

  useEffect(() => {
    const rawName = guest?.auth?.name || savoriaAuth?.name || user?.name || ''
    const sourceName = formatCustomerFullName(rawName, '')
    const sourceEmail = guest?.auth?.email || savoriaAuth?.email || user?.email || ''
    const sourcePhone = guest?.auth?.phone || savoriaAuth?.phone || user?.phone || ''
    setName(sourceName)
    setEmail(sourceEmail)
    setPhone(sourcePhone)
  }, [user, guest?.auth, savoriaAuth])

  const nameInitials = (name.trim() || phone || 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const needsName = isPlaceholderCustomerName(
    guest?.auth?.name || savoriaAuth?.name || user?.name,
  )

  const shellClass = variant === 'platform'
    ? 'platform-card rounded-2xl p-6 sm:p-8'
    : isOrderPanel
      ? 'sv-glass rounded-2xl p-6 sm:p-8'
      : 'rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8'

  const handleSave = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      toast.error('Enter your name')
      return
    }

    if (!isOrderPanel) {
      const trimmedEmail = email.trim().toLowerCase()
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        toast.error('Enter a valid email address')
        return
      }
    }

    setSaving(true)
    try {
      if (hasAccount) {
        const payload = isOrderPanel ? { name: trimmedName } : { name: trimmedName, email: email.trim().toLowerCase() }
        const { data } = await authAPI.updateProfile(payload)
        dispatch(setCredentials({
          user: data.user,
          accessToken,
          refreshToken,
          memberships: data.memberships || memberships,
        }))
        const current = loadSavoriaSession() || {}
        const nextAuth = {
          ...(current.auth || savoriaAuth || {}),
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || phone,
          verified: true,
          verifiedAt: current.auth?.verifiedAt || Date.now(),
        }
        patchSavoriaSession({ auth: nextAuth, orderCustomerAuth: true })
        guest?.completeAuth?.(nextAuth)
        guest?.refreshSession?.()
        toast.success(isOrderPanel ? 'Name updated' : 'Profile updated')
      } else {
        const current = loadSavoriaSession() || {}
        const nextAuth = {
          ...(current.auth || savoriaAuth || {}),
          name: trimmedName,
          email: email || current.auth?.email,
          phone: phone || current.auth?.phone,
          verified: true,
          verifiedAt: current.auth?.verifiedAt || Date.now(),
        }
        patchSavoriaSession({ auth: nextAuth, orderCustomerAuth: true })
        guest?.completeAuth?.(nextAuth)
        guest?.refreshSession?.()
        toast.success('Name saved on this device')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (isGuestOnOrder) {
    const profilePath = withQuery('/order/settings')
    return (
      <div className="sv-page max-w-lg mx-auto pb-8 px-4 py-4">
        <div className="space-y-3 mb-6">
          <h1 className="sv-display font-bold text-lg text-[var(--sv-text)]">Profile</h1>
          <OrderPanelActionBar active="profile" />
        </div>
        <div className="sv-glass rounded-2xl p-6 text-center">
          <p className="text-[var(--sv-text)] font-medium mb-2">Sign in to view your profile</p>
          <p className="text-sm text-[var(--sv-text-muted)] mb-5">
            Sign up at checkout — your name and phone from WhatsApp will appear here.
          </p>
          <button
            type="button"
            onClick={() => guest?.requirePaymentAuth?.(profilePath)}
            className="sv-btn-primary w-full"
          >
            Sign up / Log in
          </button>
        </div>
      </div>
    )
  }

  const pageWrap = isOrderPanel ? 'sv-page max-w-lg mx-auto pb-8 px-4 py-4' : 'max-w-2xl mx-auto'

  return (
    <div className={pageWrap}>
      {isOrderPanel ? (
        <div className="space-y-3 mb-6">
          <h1 className="sv-display font-bold text-lg text-[var(--sv-text)]">Profile</h1>
          <OrderPanelActionBar active="profile" />
        </div>
      ) : (
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-400/80 mb-1">Account</p>
        <h1 className="text-2xl font-bold text-stone-50">Settings</h1>
        <p className="text-stone-400 text-sm mt-1">Edit your name and contact details</p>
      </div>
      )}

      <form onSubmit={handleSave} className={shellClass}>
        {isOrderPanel ? (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <span className="w-16 h-16 rounded-full bg-[var(--sv-accent-glow)] border border-[var(--sv-accent)]/30 text-[var(--sv-accent)] font-bold text-xl flex items-center justify-center mb-3">
                {nameInitials}
              </span>
              <p className="text-sm text-[var(--sv-text-muted)]">
                {phone || 'Verified via WhatsApp'}
              </p>
              {needsName && (
                <p className="text-xs text-[var(--sv-accent)] mt-2">
                  Add your name so staff can identify your order.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sv-text-muted)] mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="sv-input"
                placeholder="Enter your name"
                maxLength={80}
                required
                autoComplete="name"
              />
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={saving}
                className="sv-btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <FiSave size={14} />
                {saving ? 'Saving…' : 'Save name'}
              </button>
            </div>
          </>
        ) : (
          <>
        <div className="flex items-center gap-2 mb-6 text-sm text-stone-400">
          <FiShield className="text-orange-400" size={16} />
          <span>{displayRole}</span>
          <span className="text-stone-600">·</span>
          <span>Sign-in via WhatsApp OTP</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500/50"
              placeholder="Your name"
              maxLength={80}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              <FiMail className="inline mr-1 -mt-0.5" size={12} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500/50"
              placeholder="you@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              <FiPhone className="inline mr-1 -mt-0.5" size={12} />
              Mobile (read-only)
            </label>
            <input
              type="text"
              value={phone || '—'}
              readOnly
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-stone-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-stone-600 mt-1">Mobile is verified at login and cannot be changed here.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="df-btn-primary text-sm inline-flex items-center gap-2"
          >
            <FiSave size={14} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link to={dashboardPath} className="df-btn-ghost text-sm">
            Back to dashboard
          </Link>
        </div>
          </>
        )}
      </form>

      {isSuperAdminUser(user) && (
        <section className={`${shellClass} mt-4`}>
          <h2 className="text-sm font-semibold text-stone-100 mb-3">Appearance</h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-stone-400">Platform theme</p>
            <ThemeToggle />
          </div>
        </section>
      )}
    </div>
  )
}
