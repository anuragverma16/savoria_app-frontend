import { useEffect, useRef, useState } from 'react'
import { FiArrowLeft, FiCheck, FiPhone } from 'react-icons/fi'
import {
  showErrorToast,
  showOtpSentToast,
  showOtpErrorToast,
  showOtpVerifyErrorToast,
} from '../../utils/appToast'
import { maskPhone } from '../../utils/savoriaOtp'
import { sendWhatsappOtp, verifyWhatsappOtp } from '../../utils/savoriaWhatsappOtp'
import { loadSavoriaSession } from '../../utils/savoriaGuestSession'

const inputClass = 'sv-auth-input'
const labelClass = 'sv-auth-label'
const btnPrimary = 'sv-auth-btn-primary'
const otpDigitClass = 'sv-auth-otp-digit'
const DEFAULT_RESEND_SECONDS = 60

function PhoneField({ id = 'user-phone', value, onChange, label = 'Mobile number' }) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>{label}</label>
      <div className="sv-auth-phone-wrap">
        <span className="sv-auth-phone-prefix" aria-hidden>+91</span>
        <input
          id={id}
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

export default function SavoriaUserAuthForm({ mode = 'login', onSuccess }) {
  const isSignup = mode === 'signup'
  const scannedSession = loadSavoriaSession() || {}
  const scannedRestaurantName = scannedSession.restaurantName || ''
  const scannedRestaurantId = scannedSession.rid || ''
  const hasScannedRestaurant = Boolean(scannedRestaurantId && scannedRestaurantName)
  const [step, setStep] = useState('form')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [restaurantName, setRestaurantName] = useState(scannedRestaurantName)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [otpSent, setOtpSent] = useState(false)
  const successRef = useRef(null)
  const otpRefs = useRef([])

  const onPhoneChange = (e) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
    setOtpSent(false)
    setOtp(['', '', '', '', '', ''])
  }

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setInterval(() => {
      setResendIn((s) => (s > 1 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendIn])

  const validateForm = () => {
    if (phone.length < 10) {
      showErrorToast('Phone required', 'Enter your 10-digit mobile number')
      return false
    }
    if (isSignup) {
      if (!name.trim()) {
        showErrorToast('Name required', 'Enter your full name')
        return false
      }
      if (!hasScannedRestaurant && !restaurantName.trim()) {
        showErrorToast('Restaurant required', 'Enter restaurant name')
        return false
      }
    }
    return true
  }

  const handleSendCode = async (isResend = false) => {
    if (!validateForm()) return
    if (isResend && resendIn > 0) return

    setLoading(true)
    try {
      const result = await sendWhatsappOtp(phone, isSignup ? 'signup' : 'login')
      setMaskedPhone(result.maskedPhone || maskPhone(phone))
      setResendIn(result.resendIn || DEFAULT_RESEND_SECONDS)
      setOtpSent(true)
      showOtpSentToast(result.maskedPhone || maskPhone(phone), {
        whatsapp: true,
        sender: 'Savoria SaaS Team',
      })
      setStep('otp')
      if (isResend) {
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      }
    } catch (err) {
      if (err.resendIn) setResendIn(err.resendIn)
      showOtpErrorToast(err.message)
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
  }

  const handleVerify = async (code) => {
    if (!otpSent) {
      showErrorToast('Code required', 'Send WhatsApp code first')
      return
    }
    const trimmed = String(code || otp.join('')).trim()
    if (trimmed.length !== 6) {
      showErrorToast('Incomplete code', 'Enter all 6 digits from WhatsApp')
      return
    }

    setLoading(true)
    try {
      const result = await verifyWhatsappOtp(
        phone,
        trimmed,
        isSignup
          ? {
            name,
            restaurantName: hasScannedRestaurant ? scannedRestaurantName : restaurantName,
            restaurantId: hasScannedRestaurant ? scannedRestaurantId : undefined,
          }
          : { restaurantId: scannedRestaurantId || undefined },
        isSignup ? 'signup' : 'login',
      )

      setStep('success')
      setTimeout(() => onSuccess?.({ ...result, phone }), 900)
    } catch (err) {
      showOtpVerifyErrorToast(err.message)
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus()
  }, [step])

  if (step === 'success') {
    return (
      <div className="sv-auth-success py-4 text-center">
        <div
          ref={successRef}
          className="w-14 h-14 mx-auto mb-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"
        >
          <FiCheck className="text-white" size={26} strokeWidth={3} />
        </div>
        <h3 className="text-base font-bold text-white">
          {isSignup ? 'Account created' : 'Welcome back'}
        </h3>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="sv-auth-otp-step">
        <button type="button" onClick={() => { setStep('form'); setOtpSent(false) }} className="sv-auth-back-btn">
          <FiArrowLeft size={14} /> Back
        </button>
        <p className="sv-auth-otp-hint">
          Verification code sent to{' '}
          <span className="text-emerald-400 font-medium">{maskedPhone}</span>
        </p>
        <p className="sv-auth-otp-whatsapp-note">
          Check WhatsApp from <span className="text-emerald-400/90">Savoria SaaS Team</span>. Code expires in 5 minutes.
        </p>
        <div className="sv-auth-otp-row">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className={otpDigitClass}
              aria-label={`Code digit ${i + 1}`}
            />
          ))}
        </div>
        <div className="sv-auth-actions-row">
          <button
            type="button"
            disabled={loading || !otpSent || otp.join('').length < 6}
            onClick={() => handleVerify()}
            className={btnPrimary}
          >
            {loading ? 'Verifying…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
          <button
            type="button"
            disabled={loading || resendIn > 0}
            onClick={() => handleSendCode(true)}
            className="sv-auth-link-btn"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`sv-auth-form ${isSignup ? 'sv-auth-form--signup' : 'sv-auth-form--login'}`}>
      {isSignup ? (
        <div className="sv-auth-fields-grid">
          <div className="sv-auth-field-span">
            <label className={labelClass} htmlFor="user-name">Full name</label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anurag"
              className={inputClass}
            />
          </div>
          <div className="sv-auth-field-span">
            <PhoneField value={phone} onChange={onPhoneChange} />
          </div>
          <div className="sv-auth-field-span">
            {hasScannedRestaurant ? (
              <div>
                <label className={labelClass}>Restaurant</label>
                <p className="sv-auth-input bg-white/5 text-white/80 cursor-default">
                  {scannedRestaurantName}
                </p>
              </div>
            ) : (
              <>
                <label className={labelClass} htmlFor="user-restaurant">Restaurant name</label>
                <input
                  id="user-restaurant"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Restaurant you visit"
                  className={inputClass}
                />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="sv-auth-fields-grid sv-auth-fields-grid--login-email">
          <div className="sv-auth-field-span">
            <PhoneField id="login-phone" value={phone} onChange={onPhoneChange} label="Mobile number" />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => handleSendCode(false)}
        className={btnPrimary}
      >
        {loading ? 'Sending…' : (
          <span className="inline-flex items-center justify-center gap-2">
            <FiPhone size={16} />
            {isSignup ? 'Send verification code' : 'Send login code'}
          </span>
        )}
      </button>
      <p className="text-center text-[11px] text-white/40 mt-2">
        {isSignup
          ? 'Savoria SaaS Team will send a 6-digit code on WhatsApp to verify your account'
          : 'Registered numbers only. New user? Switch to Sign up first.'}
      </p>
    </div>
  )
}
