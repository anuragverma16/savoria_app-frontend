import { useEffect, useRef } from 'react'
import { FiArrowLeft, FiMessageCircle } from 'react-icons/fi'
import './platform-provision.css'

export default function PlatformProvisionOtpStep({
  maskedPhone,
  otp,
  onOtpChange,
  onBack,
  onResend,
  resendIn,
  sending,
  disabled,
}) {
  const otpRefs = useRef([])

  useEffect(() => {
    otpRefs.current[0]?.focus()
  }, [])

  const handleDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    onOtpChange(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((d, i) => { next[i] = d })
    onOtpChange(next)
    otpRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="pv-otp-step space-y-4">
      <div className="pv-otp-banner">
        <div className="pv-otp-banner-icon">
          <FiMessageCircle size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-100">Verify WhatsApp number</p>
          <p className="text-xs text-stone-400 mt-0.5">
            Code sent to {maskedPhone || 'the mobile number'} — required before creating this account.
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-2 sm:gap-2.5">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { otpRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigit(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className="pv-otp-digit"
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-50"
        >
          <FiArrowLeft size={14} />
          Edit details
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={disabled || sending || resendIn > 0}
          className="text-orange-400 hover:text-orange-300 disabled:text-stone-600 transition-colors"
        >
          {sending
            ? 'Sending...'
            : resendIn > 0
              ? `Resend in ${resendIn}s`
              : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
