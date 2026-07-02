import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiMail, FiPhone, FiSave, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/dineflow'
import ThemeToggle from '../../components/dineflow/ThemeToggle'
import { useSavoriaGuestOptional } from '../../contexts/SavoriaGuestContext'
import { loadSavoriaSession, patchSavoriaSession } from '../../utils/savoriaGuestSession'
import { getNavbarDashboardPath, isSuperAdminUser } from '../../utils/panelRole'
import { shouldOpenSuperAdminPanel } from '../../utils/superAdminPhone'
import { setCredentials } from '../../store/slices/authSlice'

function roleLabel(user, guestName) {
  if (shouldOpenSuperAdminPanel(user, user?.phone)) return 'Super Admin'
  if (user?.role === 'admin' || user?.platformRole === 'admin') return 'Restaurant Admin'
  if (user?.role === 'staff' || user?.platformRole === 'staff') return 'Staff'
  if (guestName || user?.role === 'user') return 'Customer'
  return user?.role || 'Account'
}

export default function AccountSettingsPage({ variant = 'default' }) {
  const dispatch = useDispatch()
  const { user, memberships, accessToken, refreshToken } = useSelector((s) => s.auth)
  const guest = useSavoriaGuestOptional()
  const savoriaAuth = loadSavoriaSession()?.auth

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
    const sourceName = user?.name || guest?.auth?.name || savoriaAuth?.name || ''
    const sourceEmail = user?.email || guest?.auth?.email || savoriaAuth?.email || ''
    const sourcePhone = user?.phone || guest?.auth?.phone || savoriaAuth?.phone || ''
    setName(sourceName)
    setEmail(sourceEmail)
    setPhone(sourcePhone)
  }, [user, guest?.auth, savoriaAuth])

  const shellClass = variant === 'platform'
    ? 'platform-card rounded-2xl p-6 sm:p-8'
    : 'rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8'

  const handleSave = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      toast.error('Enter your full name')
      return
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Enter a valid email address')
      return
    }

    setSaving(true)
    try {
      if (hasAccount) {
        const { data } = await authAPI.updateProfile({
          name: trimmedName,
          email: trimmedEmail,
        })
        dispatch(setCredentials({
          user: data.user,
          accessToken,
          refreshToken,
          memberships: data.memberships || memberships,
        }))
        toast.success('Profile updated')
      } else {
        const current = loadSavoriaSession() || {}
        const nextAuth = {
          ...(current.auth || savoriaAuth || {}),
          name: trimmedName,
          email: trimmedEmail,
          phone: phone || current.auth?.phone,
          verified: true,
          verifiedAt: current.auth?.verifiedAt || Date.now(),
        }
        patchSavoriaSession({ auth: nextAuth })
        guest?.refreshSession?.()
        toast.success('Profile saved on this device')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-400/80 mb-1">Account</p>
        <h1 className="text-2xl font-bold text-stone-50">Settings</h1>
        <p className="text-stone-400 text-sm mt-1">Edit your name and contact details</p>
      </div>

      <form onSubmit={handleSave} className={shellClass}>
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
