import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { FiX } from 'react-icons/fi'
import PlatformProvisionForm from './PlatformProvisionForm'
import './platform-provision.css'

const TITLES = {
  restaurant: 'New restaurant & admin',
  admin: 'Add restaurant admin',
  staff: 'Add restaurant staff',
}

const SUBTITLES = {
  restaurant: 'Create the restaurant and admin — login is mobile WhatsApp OTP only',
  admin: 'Add admin with email + mobile for the selected restaurant',
  staff: 'Add staff with email + mobile — they sign in on the Staff tab',
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
  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const headerRef = useRef(null)
  const actionsRef = useRef(null)
  const animateKey = `${createMode}-${selectedRestaurant?._id || 'new'}-${open}`

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
    if (!modalRef.current) {
      onClose()
      return
    }
    animateOut(onClose)
  }

  if (!open) return null

  const submitLabel = saving
    ? 'Saving...'
    : createMode === 'restaurant'
      ? 'Create restaurant'
      : createMode === 'staff'
        ? 'Add staff'
        : 'Add admin'

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
              {TITLES[createMode] || TITLES.admin}
            </h3>
            <p className="pv-modal-subtitle">
              {SUBTITLES[createMode] || SUBTITLES.admin}
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

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (saving) return
            onSubmit(e)
          }}
          className="space-y-3"
        >
          <PlatformProvisionForm
            createMode={createMode}
            selectedRestaurant={selectedRestaurant}
            form={form}
            onFieldChange={onFieldChange}
            onPhoneChange={onPhoneChange}
            disabled={saving}
            animateKey={animateKey}
          />

          <div ref={actionsRef} className="pv-modal-actions">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="pv-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pv-btn-submit"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
