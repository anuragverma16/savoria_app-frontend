import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { motion } from 'framer-motion'
import { FiArrowRight, FiMapPin } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'

export default function SavoriaWelcomePage() {
  const { restaurant } = useSavoriaGuest()
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const logoRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(logoRef.current, { scale: 0, rotation: -20, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' })
      .fromTo(heroRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
      .fromTo(contentRef.current?.children || [], { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.5 }, '-=0.2')
  }, [])

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-[var(--sv-accent-glow)] blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md text-center relative z-10"
      >
        <div ref={logoRef} className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-3xl sv-glass p-3 shadow-2xl mb-4">
            <img
              src={restaurant.logo || '/logo.png'}
              alt={restaurant.name}
              className="w-full h-full object-contain rounded-2xl"
              onError={(e) => { e.target.src = '/logo.png' }}
            />
          </div>
          <span className="sv-badge">Welcome</span>
        </div>

        <div ref={heroRef}>
          <h1 className="sv-display text-4xl md:text-5xl font-bold text-[var(--sv-text)] mb-2 leading-tight">
            {restaurant.name}
          </h1>
          <p className="text-[var(--sv-text-muted)] text-sm mb-6">{restaurant.tagline || 'Fine Dining · Craft Kitchen'}</p>
        </div>

        <div ref={contentRef} className="space-y-4">
          <div className="sv-glass inline-flex items-center gap-2 px-5 py-3 rounded-2xl">
            <FiMapPin className="text-[var(--sv-accent)]" size={18} />
            <div className="text-left">
              <p className="text-xs text-[var(--sv-text-muted)]">Your Table</p>
              <p className="font-bold text-lg text-[var(--sv-text)]">Table {restaurant.tableNumber}</p>
            </div>
          </div>

          <p className="text-sm text-[var(--sv-text-muted)] leading-relaxed px-2">
            Browse our curated menu, order from your table, and track your meal in real time — no app download needed.
          </p>

          <button
            type="button"
            onClick={() => navigate('/order/menu')}
            className="sv-btn-primary w-full py-4 text-base group mt-4"
          >
            Explore Menu
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      <p className="absolute bottom-6 text-xs text-[var(--sv-text-muted)]">
        Powered by <span className="text-[var(--sv-accent)] font-semibold">Savoria</span>
      </p>
    </div>
  )
}
