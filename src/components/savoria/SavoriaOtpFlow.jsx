import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { FiArrowLeft, FiCheck, FiPhone } from 'react-icons/fi'
import {
  showErrorToast,
  showOtpErrorToast,
  showOtpSentToast,
  showOtpVerifyErrorToast,
} from '../../utils/appToast'
import { sendOtp, verifyOtp, maskPhone } from '../../utils/savoriaOtp'
import { sendWhatsappOtp, verifyWhatsappOtp } from '../../utils/savoriaWhatsappOtp'

const inputClass = 'sv-auth-input'
const labelClass = 'sv-auth-label'
const btnPrimary = 'sv-auth-btn-primary'
const otpDigitClass = 'sv-auth-otp-digit'
const DEFAULT_RESEND_SECONDS = 60

function PhoneField({ id = 'auth-phone', value, onChange, label = 'Contact number' }) {
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
          placeholder="Enter contact number"
          className="sv-auth-phone-input"
          autoComplete="tel-national"
        />
        <FiPhone className="sv-auth-phone-icon" size={16} aria-hidden />
      </div>
    </div>
  )
}

export default function SavoriaOtpFlow({
  onBack,
  onSuccess,
  signup = false,
  embedded = false,
  requireRestaurantName = false,
  collectEmail = false,
  channel = 'whatsapp',
}) {
  const [step, setStep] = useState('phone')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [masked, setMasked] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const successRef = useRef(null)
  const otpRefs = useRef([])

  const needsRestaurant = signup || requireRestaurantName
  const isWhatsapp = channel === 'whatsapp'
  const purpose = signup ? 'signup' : 'login'
  const sendChannelOtp = (p) => (isWhatsapp ? sendWhatsappOtp(p, purpose) : sendOtp(p))
  const verifyChannelOtp = (p, c, profile) => (
    isWhatsapp ? verifyWhatsappOtp(p, c, profile, purpose) : verifyOtp(p, c, profile)
  )
  const channelLabel = isWhatsapp ? 'WhatsApp' : 'SMS'

  const onPhoneChange = (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setInterval(() => {
      setResendIn((seconds) => (seconds > 1 ? seconds - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendIn])

  const handleSendOtp = async (isResend = false) => {
    if (signup && !name.trim()) {
      showErrorToast('Name required', 'Enter your full name')
      return
    }
    if ((signup || collectEmail) && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showErrorToast('Invalid email', 'Enter a valid email address')
      return
    }
    if (signup && collectEmail && !email.trim()) {
      showErrorToast('Email required', 'Enter your email address')
      return
    }
    if (needsRestaurant && !restaurantName.trim()) {
      showErrorToast('Restaurant required', 'Enter restaurant name')
      return
    }
    if (isResend && resendIn > 0) return

    setLoading(true)
    try {
      const result = await sendChannelOtp(phone)
      setMasked(result.maskedPhone)
      setResendIn(result.resendIn || DEFAULT_RESEND_SECONDS)
      showOtpSentToast(result.maskedPhone || maskPhone(phone), {
        whatsapp: isWhatsapp,
        sender: isWhatsapp ? 'Savoria SaaS Team' : undefined,
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
    if (next.every((d) => d) && next.join('').length === 6) {
      handleVerify(next.join(''))
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (code) => {
    setLoading(true)
    try {
      const profile = {}
      if (signup && name.trim()) profile.name = name.trim()
      if (email.trim()) profile.email = email.trim().toLowerCase()
      if (needsRestaurant && restaurantName.trim()) {
        profile.restaurantName = restaurantName.trim()
      }
      const result = await verifyChannelOtp(phone, code || otp.join(''), profile)
      setStep('success')
      setTimeout(() => {
        if (successRef.current) {
          gsap.fromTo(successRef.current,
            { scale: 0 },
            { scale: 1, duration: 0.6, ease: 'back.out(2)' },
          )
        }
      }, 50)
      setTimeout(() => onSuccess(isWhatsapp ? result : result.user || result), 1200)
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
        <h3 className="text-base font-bold text-white">Verified</h3>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="sv-auth-otp-step">
        <button
          type="button"
          onClick={() => setStep('phone')}
          className="sv-auth-back-btn"
        >
          <FiArrowLeft size={14} /> Change number
        </button>
        <p className="sv-auth-otp-hint">
          {isWhatsapp ? 'Check WhatsApp on' : 'OTP sent to'}{' '}
          <span className="text-emerald-400 font-medium">{masked || maskPhone(phone)}</span>
        </p>
        {isWhatsapp ? (
          <p className="sv-auth-otp-whatsapp-note">
            Open WhatsApp on this same number. If you don&apos;t get a message, send join &lt;code&gt; to +1 415 523 8886 first.
          </p>
        ) : null}
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
              aria-label={`OTP digit ${i + 1}`}
            />
          ))}
        </div>
        <div className="sv-auth-actions-row">
          <button
            type="button"
            disabled={loading || otp.join('').length < 6}
            onClick={() => handleVerify()}
            className={btnPrimary}
          >
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button
            type="button"
            disabled={loading || resendIn > 0}
            onClick={() => handleSendOtp(true)}
            className="sv-auth-link-btn"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`sv-auth-form ${signup ? 'sv-auth-form--signup' : 'sv-auth-form--login'}`}>
      {onBack && (
        <button type="button" onClick={onBack} className="sv-auth-back-btn">
          <FiArrowLeft size={14} /> Back
        </button>
      )}

      {signup ? (
        <div className="sv-auth-fields-grid">
          <div>
            <label className={labelClass} htmlFor="auth-name">Full name</label>
            <input
              id="auth-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anurag"
              required
              className={inputClass}
            />
          </div>
          {collectEmail ? (
            <div>
              <label className={labelClass} htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className={inputClass}
                autoComplete="email"
              />
            </div>
          ) : null}
          <div>
            <label className={labelClass} htmlFor="auth-restaurant">Restaurant name</label>
            <input
              id="auth-restaurant"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant you are visiting"
              required
              className={inputClass}
            />
          </div>
          <div className="sv-auth-field-span">
            <PhoneField value={phone} onChange={onPhoneChange} />
          </div>
        </div>
      ) : needsRestaurant ? (
        <div className="sv-auth-fields-grid sv-auth-fields-grid--login-restaurant">
          <div className="sv-auth-field-span">
            <label className={labelClass} htmlFor="auth-restaurant-login">Restaurant name</label>
            <input
              id="auth-restaurant-login"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant you are visiting"
              required
              className={inputClass}
            />
          </div>
          <div className="sv-auth-field-span">
            <PhoneField value={phone} onChange={onPhoneChange} />
          </div>
        </div>
      ) : (
        <PhoneField value={phone} onChange={onPhoneChange} />
      )}

      <button
        type="button"
        disabled={
          loading
          || phone.length < 10
          || (signup && !name.trim())
          || (signup && collectEmail && !email.trim())
          || (needsRestaurant && !restaurantName.trim())
        }
        onClick={() => handleSendOtp(false)}
        className={btnPrimary}
      >
        {loading ? 'Sending…' : `Send ${channelLabel} OTP`}
      </button>
      {isWhatsapp && (
        <p className="text-center text-[11px] text-white/40 mt-2">
          You&apos;ll receive a 6-digit code on WhatsApp
        </p>
      )}
    </div>
  )
}
