import { useEffect, useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { maskPhone, sendWhatsappOtp, verifyWhatsappOtp } from '../../utils/savoriaWhatsappOtp'
import { setCredentials } from '../../store/slices/authSlice'
import { useDispatch } from 'react-redux'

const DEFAULT_RESEND_SECONDS = 60

function PhoneField({ value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        Mobile number
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

export default function AdminStaffOtpLogin({ loginRole, onSuccess, loading: parentLoading }) {
  const dispatch = useDispatch()
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const otpRefs = useRef([])

  const roleLabel = loginRole === 'admin' ? 'Admin' : 'Staff'

  useEffect(() => {
    setStep('phone')
    setPhone('')
    setOtp(['', '', '', '', '', ''])
    setMaskedPhone('')
    setResendIn(0)
  }, [loginRole])

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setInterval(() => setResendIn((s) => (s > 1 ? s - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [resendIn])

  const onPhoneChange = (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))

  const handleSendCode = async (isResend = false) => {
    if (phone.length < 10) {
      toast.error('Enter your 10-digit mobile number')
      return
    }
    if (isResend && resendIn > 0) return

    setLoading(true)
    try {
      const result = await sendWhatsappOtp(phone, 'login', loginRole)
      setMaskedPhone(result.maskedPhone || maskPhone(phone))
      setResendIn(result.resendIn || DEFAULT_RESEND_SECONDS)
      setStep('otp')
      toast.success(`WhatsApp code sent to ${result.maskedPhone || maskPhone(phone)}`)
      if (isResend) {
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      }
    } catch (err) {
      if (err.resendIn) setResendIn(err.resendIn)
      toast.error(err.message || 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  const completeLogin = async (code) => {
    setLoading(true)
    try {
      const result = await verifyWhatsappOtp(phone, code, {}, 'login', loginRole)
      dispatch(setCredentials({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        memberships: result.memberships,
      }))
      onSuccess(result, loginRole)
    } catch (err) {
      toast.error(err.message || 'Invalid code')
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
    if (next.every((d) => d) && next.join('').length === 6) {
      completeLogin(next.join(''))
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const busy = loading || parentLoading

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setStep('phone')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <FiArrowLeft size={14} /> Change number
        </button>
        <p className="text-sm text-slate-600">
          Enter the 6-digit code sent to <span className="font-semibold text-slate-800">{maskedPhone || maskPhone(phone)}</span> on WhatsApp
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
              disabled={busy}
              className="w-11 h-12 text-center rounded-xl border-2 border-slate-200 text-lg font-bold text-slate-900 focus:border-[var(--df-accent)] focus:outline-none"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => handleSendCode(true)}
          disabled={busy || resendIn > 0}
          className="w-full text-sm text-[var(--df-accent)] font-semibold disabled:opacity-50"
        >
          {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend WhatsApp code'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {roleLabel} sign-in uses your registered mobile number and a WhatsApp OTP — no password.
      </p>
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
