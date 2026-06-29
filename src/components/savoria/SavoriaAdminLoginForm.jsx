import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiArrowRight, FiUser, FiGrid } from 'react-icons/fi'
import { loginUser } from '../../store/slices/authSlice'
import {
  getRedirectAfterLogin,
  hydrateTenantAfterAuth,
  shouldBlockSuspendedRestaurant,
  RESTAURANT_SUSPENDED_MESSAGE,
} from '../../utils/panelRole'
import { resetPageLocks } from '../../utils/resetPageLocks'
import toast from 'react-hot-toast'

const inputClass = 'sv-auth-input'
const labelClass = 'sv-auth-label'

export default function SavoriaAdminLoginForm({ onSuccess, compact = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((s) => s.auth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await dispatch(loginUser({
        email: email.trim().toLowerCase(),
        password,
        role: 'admin',
      })).unwrap()

      const { membership, restaurant } = hydrateTenantAfterAuth(
        dispatch,
        { user: result.user, memberships: result.memberships, loginRole: 'admin' },
        'admin',
      )

      const targetRestaurant = restaurant || membership?.restaurant || result.user?.restaurant
      if (shouldBlockSuspendedRestaurant(result.user, targetRestaurant)) {
        toast.error(RESTAURANT_SUSPENDED_MESSAGE)
        navigate('/restaurant-suspended', {
          replace: true,
          state: { restaurantName: targetRestaurant?.name },
        })
        return
      }

      const path = getRedirectAfterLogin(result.user, membership || { restaurant: targetRestaurant })
      if (!path) {
        toast.error('No admin access for this account.')
        return
      }

      toast.success(`Welcome, ${result.user?.name?.split(' ')[0] || 'Admin'}!`)
      resetPageLocks()
      onSuccess?.()
      navigate(path, { replace: true })
    } catch (err) {
      toast.error(err || 'Admin sign in failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'sv-auth-admin-compact' : 'space-y-4'}>
      <div className={compact ? 'sv-auth-fields-grid sv-auth-fields-grid--admin' : 'space-y-4'}>
        <div>
          <label className={labelClass} htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@restaurant.com"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="admin-password">Password</label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>
      </div>
      <button type="submit" disabled={loading} className="sv-auth-btn-primary">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Admin sign in <FiArrowRight size={18} />
          </span>
        )}
      </button>
    </form>
  )
}

export function AuthRoleSwitch({ value, onChange }) {
  return (
    <div className="sv-auth-role-switch">
      <button
        type="button"
        onClick={() => onChange('user')}
        className={`sv-auth-role-pill ${value === 'user' ? 'is-active is-active--user' : ''}`}
      >
        <FiUser size={15} />
        Customer
      </button>
      <button
        type="button"
        onClick={() => onChange('admin')}
        className={`sv-auth-role-pill ${value === 'admin' ? 'is-active is-active--admin' : ''}`}
      >
        <FiGrid size={15} />
        Admin
      </button>
    </div>
  )
}
