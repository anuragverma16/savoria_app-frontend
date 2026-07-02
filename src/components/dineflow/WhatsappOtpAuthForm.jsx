import { useEffect, useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { maskPhone, sendWhatsappOtp, verifyWhatsappOtp } from '../../utils/savoriaWhatsappOtp'
import { setCredentials } from '../../store/slices/authSlice'

const DEFAULT_RESEND_SECONDS = 60

function PhoneField({ value, onChange, disabled, label = 'Mobile number' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={value}
          onChange={onChange}
          placeholder="10-digit WhatsApp number"
          disabled={disabled}
          className="df-input w-full pl-12"
          autoComplete="tel-national"
        />
        <FiPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
      </div>
    </div>
  )
}

/**
 * WhatsApp OTP only — login/signup cannot complete without a verified 6-digit code.
 * loginRole: 'admin' | 'staff' for panel login; omit for customer/user.
 */
export default function WhatsappOtpAuthForm({
  mode = 'login',
  loginRole,
  onSuccess,
  loading: parentLoading,
  dispatchCredentials = true,
}) {
  const dispatch = useDispatch()
  const isSignup = mode === 'signup'
  const [step, setStep] = useState('details')
  const [name, setName] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [otpSent, setOtpSent] = useState(false)
  const otpRefs = useRef([])

  const panelRole = loginRole === 'admin' || loginRole === 'staff' ? loginRole : null
  const roleLabel = panelRole === 'admin' ? 'Admin' : panelRole === 'staff' ? 'Staff' : 'User'

  useEffect(() => {
    setStep('details')
    setName('')
    setRestaurantName('')
    setPhone('')
    setOtp(['', '', '', '', '', ''])
    setMaskedPhone('')
    setResendIn(0)
    setOtpSent(false)
  }, [mode, loginRole])

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setInterval(() => setResendIn((s) => (s > 1 ? s - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [resendIn])

  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus()
  }, [step])

  const onPhoneChange = (e) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
    setOtpSent(false)
    setOtp(['', '', '', '', '', ''])
  }

  const validateDetails = () => {
    if (phone.length < 10) {
      toast.error('Enter your 10-digit mobile number')
      return false
    }
    if (isSignup) {
      if (!name.trim()) {
        toast.error('Enter your full name')
        return false
      }
      if (!restaurantName.trim()) {
        toast.error('Enter restaurant name')
        return false
      }
    }
    return true
  }

  const handleSendCode = async (isResend = false) => {
    if (!validateDetails()) return
    if (isResend && resendIn > 0) return

    setLoading(true)
    try {
      const purpose = isSignup ? 'signup' : 'login'
      const result = await sendWhatsappOtp(phone, purpose, panelRole || undefined)
      setMaskedPhone(result.maskedPhone || maskPhone(phone))
      setResendIn(result.resendIn || DEFAULT_RESEND_SECONDS)
      setOtpSent(true)
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      toast.success(`WhatsApp code sent to ${result.maskedPhone || maskPhone(phone)}`)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch (err) {
      if (err.resendIn) setResendIn(err.resendIn)
      toast.error(err.message || 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  const completeAuth = async (code) => {
    const trimmed = String(code || '').trim()
    if (!otpSent) {
      toast.error('Send WhatsApp code first')
      return
    }
    if (trimmed.length !== 6) {
      toast.error('Enter the full 6-digit WhatsApp code')
      return
    }

    setLoading(true)
    try {
      const purpose = isSignup ? 'signup' : 'login'
      const profile = isSignup ? { name, restaurantName } : {}
      const result = await verifyWhatsappOtp(phone, trimmed, profile, purpose, panelRole || undefined)

      if (dispatchCredentials && result.accessToken) {
        dispatch(setCredentials({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          memberships: result.memberships,
        }))
      }

      onSuccess?.(result, panelRole || 'user')
    } catch (err) {
      toast.error(err.message || 'Invalid code — check WhatsApp and try again')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter' && otp.join('').length === 6 && otpSent) {
      e.preventDefault()
      completeAuth(otp.join(''))
    }
  }

  const busy = loading || parentLoading
  const otpCode = otp.join('')
  const canVerify = otpSent && otpCode.length === 6 && !busy

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setStep('details')
            setOtp(['', '', '', '', '', ''])
          }}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <FiArrowLeft size={14} /> Change number
        </button>
        <p className="text-sm text-slate-600">
          Enter the <strong>6-digit WhatsApp code</strong> sent to{' '}
          <span className="font-semibold text-slate-800">{maskedPhone || maskPhone(phone)}</span>
        </p>
        <div className="flex justify-center gap-2 py-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { otpRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              disabled={busy || !otpSent}
              className="w-11 h-12 text-center rounded-xl border-2 border-slate-200 text-lg font-bold text-slate-900 focus:border-[var(--df-accent)] focus:outline-none disabled:opacity-50"
              aria-label={`Digit ${index + 1}`}
              required
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => completeAuth(otpCode)}
          disabled={!canVerify}
          className="df-btn-primary w-full py-3.5 disabled:opacity-50"
        >
          {busy ? 'Verifying…' : isSignup ? 'Verify & create account' : 'Verify & sign in'}
        </button>
        <button
          type="button"
          onClick={() => handleSendCode(true)}
          disabled={busy || resendIn > 0}
          className="w-full text-sm text-[var(--df-accent)] font-semibold disabled:opacity-50"
        >
          {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend WhatsApp code'}
        </button>
        {!otpSent && (
          <p className="text-xs text-amber-600 text-center">Request a code before signing in.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {roleLabel} {isSignup ? 'sign-up' : 'sign-in'} requires a <strong>WhatsApp OTP</strong>. You cannot log in without verifying the code.
      </p>

      {isSignup && (
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Full name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              disabled={busy}
              className="df-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Restaurant name *
            </label>
            <input
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant you dine at"
              required
              disabled={busy}
              className="df-input w-full"
            />
          </div>
        </>
      )}

      <PhoneField value={phone} onChange={onPhoneChange} disabled={busy} />

      <button
        type="button"
        onClick={() => handleSendCode(false)}
        disabled={busy || phone.length < 10}
        className="df-btn-primary w-full py-3.5 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Send WhatsApp code
            <FiArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  )
}
