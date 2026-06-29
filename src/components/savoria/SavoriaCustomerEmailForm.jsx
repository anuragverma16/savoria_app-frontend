import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiEye, FiEyeOff, FiArrowRight, FiPhone } from 'react-icons/fi'
import { loginUser, registerUser } from '../../store/slices/authSlice'
import { showErrorToast, showSuccessToast } from '../../utils/appToast'

const inputClass = 'sv-auth-input'
const labelClass = 'sv-auth-label'

function PhoneField({ value, onChange }) {
  return (
    <div>
      <label className={labelClass} htmlFor="cust-phone">Mobile number</label>
      <div className="sv-auth-phone-wrap">
        <span className="sv-auth-phone-prefix" aria-hidden>+91</span>
        <input
          id="cust-phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={value}
          onChange={onChange}
          placeholder="10-digit number"
          className="sv-auth-phone-input"
          autoComplete="tel-national"
        />
        <FiPhone className="sv-auth-phone-icon" size={16} aria-hidden />
      </div>
    </div>
  )
}

export default function SavoriaCustomerEmailForm({ mode = 'login', onSuccess }) {
  const isSignup = mode === 'signup'
  const dispatch = useDispatch()
  const { loading } = useSelector((s) => s.auth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const onPhoneChange = (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()

    if (isSignup) {
      if (!name.trim()) {
        showErrorToast('Name required', 'Enter your full name')
        return
      }
      if (!trimmedEmail) {
        showErrorToast('Email required', 'Enter a valid email address')
        return
      }
      if (phone.length < 10) {
        showErrorToast('Phone required', 'Enter your 10-digit mobile number')
        return
      }
      if (!restaurantName.trim()) {
        showErrorToast('Restaurant required', 'Enter the restaurant you dine at')
        return
      }
      if (password.length < 6) {
        showErrorToast('Weak password', 'Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        showErrorToast('Password mismatch', 'Passwords do not match')
        return
      }

      try {
        const result = await dispatch(registerUser({
          name: name.trim(),
          email: trimmedEmail,
          password,
          phone: `+91${phone}`,
          restaurantName: restaurantName.trim(),
          role: 'user',
        })).unwrap()
        showSuccessToast('Account created', `Welcome, ${result.user?.name?.split(' ')[0] || 'there'}!`)
        onSuccess?.(result)
      } catch (err) {
        showErrorToast('Sign up failed', err || 'Could not create account')
      }
      return
    }

    if (!trimmedEmail || !password) {
      showErrorToast('Missing fields', 'Enter email and password')
      return
    }

    try {
      const result = await dispatch(loginUser({
        email: trimmedEmail,
        password,
        role: 'user',
      })).unwrap()
      showSuccessToast('Welcome back', result.user?.name?.split(' ')[0] || 'Guest')
      onSuccess?.(result)
    } catch (err) {
      showErrorToast('Login failed', err || 'Invalid email or password')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sv-auth-form">
      {isSignup ? (
        <div className="sv-auth-fields-grid">
          <div>
            <label className={labelClass} htmlFor="cust-name">Full name</label>
            <input
              id="cust-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anurag"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="cust-email">Email</label>
            <input
              id="cust-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className={inputClass}
              autoComplete="email"
            />
          </div>
          <div className="sv-auth-field-span">
            <PhoneField value={phone} onChange={onPhoneChange} />
          </div>
          <div className="sv-auth-field-span">
            <label className={labelClass} htmlFor="cust-restaurant">Restaurant name</label>
            <input
              id="cust-restaurant"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant you are visiting"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="cust-password">Password</label>
            <div className="relative">
              <input
                id="cust-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                className={`${inputClass} pr-11`}
                autoComplete="new-password"
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
          <div>
            <label className={labelClass} htmlFor="cust-confirm">Confirm password</label>
            <input
              id="cust-confirm"
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
        </div>
      ) : (
        <div className="sv-auth-fields-grid sv-auth-fields-grid--login-email">
          <div className="sv-auth-field-span">
            <label className={labelClass} htmlFor="cust-login-email">Email</label>
            <input
              id="cust-login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className={inputClass}
              autoComplete="email"
            />
          </div>
          <div className="sv-auth-field-span">
            <label className={labelClass} htmlFor="cust-login-password">Password</label>
            <div className="relative">
              <input
                id="cust-login-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`${inputClass} pr-11`}
                autoComplete="current-password"
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
      )}

      <button type="submit" disabled={loading} className="sv-auth-btn-primary">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {isSignup ? 'Creating account…' : 'Signing in…'}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {isSignup ? 'Create account' : 'Sign in with email'}
            <FiArrowRight size={18} />
          </span>
        )}
      </button>
    </form>
  )
}

export function AuthMethodSwitch({ value, onChange }) {
  return (
    <div className="sv-auth-method-switch">
      <button
        type="button"
        onClick={() => onChange('phone')}
        className={`sv-auth-method-pill ${value === 'phone' ? 'is-active' : ''}`}
      >
        Phone · WhatsApp
      </button>
      <button
        type="button"
        onClick={() => onChange('email')}
        className={`sv-auth-method-pill ${value === 'email' ? 'is-active' : ''}`}
      >
        Email
      </button>
    </div>
  )
}
