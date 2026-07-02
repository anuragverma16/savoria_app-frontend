import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import PlatformProvisionForm from './PlatformProvisionForm'
import PlatformProvisionOtpStep from './PlatformProvisionOtpStep'
import {
  normalizeProvisionPhone,
  sendProvisionWhatsAppOtp,
  validateProvisionForm,
} from '../../utils/platformProvisionOtp'
import './platform-provision.css'

const TITLES = {
  restaurant: 'New restaurant & admin',
  admin: 'Add restaurant admin',
  staff: 'Add restaurant staff',
}

const SUBTITLES = {
  restaurant: 'Create the restaurant and admin — WhatsApp OTP verifies the admin mobile',
  admin: 'Add admin with email + mobile — WhatsApp OTP required before saving',
  staff: 'Add staff with email + mobile — WhatsApp OTP required before saving',
}

const OTP_SUBTITLES = {
  restaurant: 'Enter the code sent to the admin mobile to create the restaurant',
  admin: 'Enter the code sent to the admin mobile to finish provisioning',
  staff: 'Enter the code sent to the staff mobile to finish provisioning',
}

export default function PlatformProvisionModal({
  open,
  createMode,
  selectedRestaurant,
  form,
  onFieldChange,
  onPhoneChange,
  onSubmit,
  onClose,
  saving,
}) {
  const [step, setStep] = useState('details')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [maskedPhone, setMaskedPhone] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [sendingOtp, setSendingOtp] = useState(false)

  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const headerRef = useRef(null)
  const actionsRef = useRef(null)
  const animateKey = `${createMode}-${selectedRestaurant?._id || 'new'}-${open}-${step}`

  const resetOtpState = useCallback(() => {
    setStep('details')
    setOtp(['', '', '', '', '', ''])
    setMaskedPhone('')
    setResendIn(0)
    setSendingOtp(false)
  }, [])

  useEffect(() => {
    if (!open) resetOtpState()
  }, [open, resetOtpState])

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setInterval(() => {
      setResendIn((seconds) => (seconds > 1 ? seconds - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendIn])

  const animateIn = useCallback(() => {
    const tl = gsap.timeline()
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo(modalRef.current,
        { scale: 0.9, opacity: 0, y: 28 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' },
        '-=0.15',
      )
      .fromTo(headerRef.current,
        { opacity: 0, x: -14 },
        { opacity: 1, x: 0, duration: 0.35 },
        '-=0.3',
      )
      .fromTo(actionsRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35 },
        '-=0.1',
      )
    return tl
  }, [])

  const animateOut = useCallback((onComplete) => {
    const tl = gsap.timeline({ onComplete })
    tl.to(modalRef.current, {
      scale: 0.94,
      opacity: 0,
      y: 16,
      duration: 0.25,
      ease: 'power2.in',
    }).to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.12')
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const tl = animateIn()
    return () => tl.kill()
  }, [open, animateIn])

  const handleClose = () => {
    if (saving) return
    if (!modalRef.current) {
      onClose()
      return
    }
    animateOut(onClose)
  }

  const sendOtp = async (isResend = false) => {
    if (isResend && resendIn > 0) return
    const validationError = validateProvisionForm(createMode, form)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSendingOtp(true)
    try {
      const result = await sendProvisionWhatsAppOtp(form.adminPhone)
      setMaskedPhone(result.maskedPhone || normalizeProvisionPhone(form.adminPhone))
      setResendIn(result.resendIn || 60)
      if (!isResend) setStep('verify')
      else {
        setOtp(['', '', '', '', '', ''])
        toast.success('New code sent')
      }
    } catch (err) {
      if (err.response?.data?.resendIn) setResendIn(err.response.data.resendIn)
      toast.error(err.response?.data?.message || 'Could not send WhatsApp code')
    } finally {
      setSendingOtp(false)
    }
  }

  const handlePrimaryAction = async (e) => {
    e.preventDefault()
    if (saving || sendingOtp) return

    if (step === 'details') {
      await sendOtp(false)
      return
    }

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      toast.error('Enter the 6-digit verification code')
      return
    }
    onSubmit({ otpCode })
  }

  if (!open) return null

  const primaryLabel = saving
    ? 'Saving...'
    : sendingOtp
      ? 'Sending code...'
      : step === 'details'
        ? 'Send WhatsApp code'
        : createMode === 'restaurant'
          ? 'Verify & create restaurant'
          : createMode === 'staff'
            ? 'Verify & add staff'
            : 'Verify & add admin'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        ref={overlayRef}
        className="pv-modal-overlay absolute inset-0"
        onClick={handleClose}
        aria-hidden
      />
      <div
        ref={modalRef}
        className="pv-modal-shell relative w-full rounded-2xl p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pv-modal-title"
      >
        <div ref={headerRef} className="pv-modal-header">
          <div className="pv-modal-header-text">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/80 mb-0.5">
              Super Admin
            </p>
            <h3 id="pv-modal-title" className="text-lg font-bold text-stone-50 leading-tight">
              {step === 'verify' ? 'Verify mobile number' : (TITLES[createMode] || TITLES.admin)}
            </h3>
            <p className="pv-modal-subtitle">
              {step === 'verify'
                ? (OTP_SUBTITLES[createMode] || OTP_SUBTITLES.admin)
                : (SUBTITLES[createMode] || SUBTITLES.admin)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handlePrimaryAction} className="space-y-3">
          {step === 'details' ? (
            <PlatformProvisionForm
              createMode={createMode}
              selectedRestaurant={selectedRestaurant}
              form={form}
              onFieldChange={onFieldChange}
              onPhoneChange={onPhoneChange}
              disabled={saving || sendingOtp}
              animateKey={animateKey}
            />
          ) : (
            <PlatformProvisionOtpStep
              maskedPhone={maskedPhone}
              otp={otp}
              onOtpChange={setOtp}
              onBack={() => setStep('details')}
              onResend={() => sendOtp(true)}
              resendIn={resendIn}
              sending={sendingOtp}
              disabled={saving}
            />
          )}

          <div ref={actionsRef} className="pv-modal-actions">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving || sendingOtp}
              className="pv-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || sendingOtp}
              className="pv-btn-submit"
            >
              {primaryLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
