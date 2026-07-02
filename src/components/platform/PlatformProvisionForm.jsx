import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { FiMail, FiPhone, FiUser, FiMapPin } from 'react-icons/fi'
import './platform-provision.css'

function Field({ label, icon: Icon, children, hint, className = '' }) {
  return (
    <div className={`relative z-[1] ${className}`}>
      <label className="pv-field-label">
        {Icon && <Icon size={12} className="text-orange-400" />}
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-stone-600 mt-1">{hint}</p>}
    </div>
  )
}

function AnimatedPhoneField({ value, onChange, disabled, phoneBoxRef }) {
  const progressRef = useRef(null)
  const glowRef = useRef(null)
  const digits = String(value || '').replace(/\D/g, '')
  const progress = Math.min(digits.length / 10, 1)

  const handleFocus = () => {
    phoneBoxRef.current?.classList.add('is-focused')
    gsap.to(phoneBoxRef.current, {
      boxShadow: '0 0 0 1px rgba(34,197,94,0.4), 0 0 28px rgba(34,197,94,0.18)',
      scale: 1.008,
      duration: 0.35,
      ease: 'power2.out',
    })
  }

  const handleBlur = () => {
    phoneBoxRef.current?.classList.remove('is-focused')
    gsap.to(phoneBoxRef.current, {
      boxShadow: '0 0 0 0 rgba(34,197,94,0)',
      scale: 1,
      duration: 0.3,
      ease: 'power2.inOut',
    })
  }

  useEffect(() => {
    if (!progressRef.current) return
    gsap.to(progressRef.current, {
      width: `${progress * 100}%`,
      duration: 0.35,
      ease: 'power2.out',
    })
    if (glowRef.current && digits.length === 10) {
      gsap.fromTo(glowRef.current,
        { opacity: 0.6, scale: 0.95 },
        { opacity: 0, scale: 1.15, duration: 0.6, ease: 'power2.out' },
      )
    }
  }, [digits.length, progress])

  return (
    <div ref={phoneBoxRef} className="pv-phone-box relative z-[1]">
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 rounded-xl bg-emerald-400/10 opacity-0"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2 mb-2 relative z-[1]">
        <label className="pv-field-label mb-0">
          <FiPhone size={12} className="text-emerald-400" />
          Mobile number *
        </label>
        <span className="pv-badge-otp">WhatsApp OTP</span>
      </div>
      <div className="pv-phone-row relative z-[1]">
        <span className="pv-phone-prefix" aria-hidden>+91</span>
        <div className="relative flex-1 min-w-0">
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="10-digit number"
            required
            disabled={disabled}
            className="pv-phone-input w-full"
            autoComplete="tel-national"
          />
          <FiPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/75 pointer-events-none" size={16} aria-hidden />
        </div>
      </div>
      <div className="pv-phone-footer relative z-[1]">
        <div className="pv-phone-progress">
          <div ref={progressRef} className="pv-phone-progress-bar" />
        </div>
        <div className="pv-phone-meta">
          <strong className="text-stone-400">{digits.length}</strong>/10
          {digits.length === 10 ? ' · Ready' : ''}
        </div>
      </div>
    </div>
  )
}

export default function PlatformProvisionForm({
  createMode,
  selectedRestaurant,
  form,
  onFieldChange,
  onPhoneChange,
  disabled,
  animateKey,
}) {
  const rootRef = useRef(null)
  const restaurantBoxRef = useRef(null)
  const personBoxRef = useRef(null)
  const phoneBoxRef = useRef(null)
  const personLabel = createMode === 'staff' ? 'Staff' : 'Admin'
  const personBoxClass = createMode === 'staff' ? 'pv-provision-box--staff' : 'pv-provision-box--person'
  const isRestaurantMode = createMode === 'restaurant'
  const useSideBySide = isRestaurantMode || Boolean(selectedRestaurant)
  const layoutClass = useSideBySide
    ? `pv-provision-layout${isRestaurantMode ? ' pv-provision-layout--restaurant-equal' : ''}`
    : 'pv-provision-layout pv-provision-layout--single'

  const runBoxAnimation = useCallback(() => {
    const boxes = [restaurantBoxRef.current, personBoxRef.current].filter(Boolean)
    if (!boxes.length) return

    gsap.fromTo(boxes,
      { x: isRestaurantMode ? 18 : 0, y: isRestaurantMode ? 0 : 14, opacity: 0, scale: 0.98 },
      {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(1.2)',
        clearProps: 'transform',
      },
    )

    if (phoneBoxRef.current) {
      gsap.set(phoneBoxRef.current, { opacity: 1 })
    }
  }, [isRestaurantMode])

  useLayoutEffect(() => {
    runBoxAnimation()
  }, [animateKey, createMode, runBoxAnimation])

  const restaurantBox = isRestaurantMode ? (
    <div
      ref={restaurantBoxRef}
      className="pv-provision-box pv-provision-box--restaurant p-3.5 sm:p-4"
    >
      <p className="relative z-[1] text-xs font-bold text-orange-200 uppercase tracking-widest mb-3">
        Restaurant
      </p>
      <div className="pv-fields-grid pv-fields-grid--2 relative z-[1]">
        <Field label="Restaurant name *" icon={FiMapPin}>
          <input
            value={form.restaurantName}
            onChange={onFieldChange('restaurantName')}
            placeholder="e.g. Spice Garden"
            required
            disabled={disabled}
            className="pv-field-input"
          />
        </Field>
        <Field label="City">
          <input
            value={form.city}
            onChange={onFieldChange('city')}
            placeholder="City (optional)"
            disabled={disabled}
            className="pv-field-input"
          />
        </Field>
      </div>
    </div>
  ) : selectedRestaurant ? (
    <div
      ref={restaurantBoxRef}
      className="pv-provision-box pv-provision-box--restaurant pv-provision-box--restaurant-compact p-3.5 sm:px-4 sm:py-3"
    >
      <div className="pv-restaurant-chip relative z-[1]">
        <div className="pv-restaurant-chip-icon">
          {selectedRestaurant.name?.charAt(0) || 'R'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-0.5">Restaurant</p>
          <p className="text-stone-100 font-semibold truncate">{selectedRestaurant.name}</p>
        </div>
        {selectedRestaurant.address?.city && (
          <p className="text-stone-500 text-sm shrink-0 hidden sm:block">{selectedRestaurant.address.city}</p>
        )}
      </div>
    </div>
  ) : null

  const personBox = (
    <div
      ref={personBoxRef}
      className={`pv-provision-box ${personBoxClass} p-3.5 sm:p-4`}
    >
      <p className="relative z-[1] text-xs font-bold text-stone-200 uppercase tracking-widest mb-3">
        {personLabel} account
      </p>
      <div className="pv-fields-grid pv-fields-grid--2 relative z-[1]">
        <Field label={`${personLabel} name *`} icon={FiUser}>
          <input
            value={form.adminName}
            onChange={onFieldChange('adminName')}
            placeholder="Full name"
            required
            disabled={disabled}
            className="pv-field-input"
          />
        </Field>
        <Field label="Email *" icon={FiMail}>
          <input
            type="email"
            value={form.adminEmail}
            onChange={onFieldChange('adminEmail')}
            placeholder="name@restaurant.com"
            required
            disabled={disabled}
            className="pv-field-input"
          />
        </Field>
        <AnimatedPhoneField
          value={form.adminPhone}
          onChange={onPhoneChange}
          disabled={disabled}
          phoneBoxRef={phoneBoxRef}
        />
        <p className="relative z-[1] text-[11px] text-stone-500 sm:col-span-2 -mt-1">
          Use a personal mobile for {personLabel.toLowerCase()} login — not the super admin number. OTP will be sent to this WhatsApp number.
        </p>
      </div>
    </div>
  )

  return (
    <div ref={rootRef} className={layoutClass}>
      {restaurantBox}
      {personBox}
    </div>
  )
}
