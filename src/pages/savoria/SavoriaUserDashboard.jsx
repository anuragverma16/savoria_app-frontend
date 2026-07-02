import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { motion } from 'framer-motion'
import { FiShoppingBag, FiClock, FiArrowRight, FiMapPin, FiPackage } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import SavoriaQrScanModal from '../../components/savoria/SavoriaQrScanModal'
import SavoriaBrandedQrScanCard from '../../components/savoria/SavoriaBrandedQrScanCard'

export default function SavoriaUserDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { restaurant, session, totals, orders, isAuthenticated, userDisplayName, refreshSession } = useSavoriaGuest()
  const [scanOpen, setScanOpen] = useState(() => searchParams.get('scan') === '1')
  const heroRef = useRef(null)
  const cardsRef = useRef(null)

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  useEffect(() => {
    if (searchParams.get('scan') === '1') setScanOpen(true)
  }, [searchParams])

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(heroRef.current, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.65 })
      .fromTo(cardsRef.current?.children || [],
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.45 },
        '-=0.35',
      )
  }, [])

  const openScan = () => {
    gsap.fromTo('.sv-scan-cta',
      { scale: 0.95 },
      { scale: 1, duration: 0.3, ease: 'back.out(2)' },
    )
    setScanOpen(true)
  }

  const hasTable = Boolean(session.qrLinked || session.tableToken)
  const pendingOrders = orders.filter((o) => !['served', 'completed', 'cancelled'].includes(o.status)).length

  return (
    <div className="min-h-[100dvh] px-4 py-8 pb-24 max-w-lg mx-auto">
      <div ref={heroRef} className="text-center mb-8">
        <span className="sv-badge mb-4 inline-block">
          {isAuthenticated ? 'Member' : 'Guest'}
        </span>
        <h1 className="sv-display text-3xl font-bold text-[var(--sv-text)] mb-2">
          {isAuthenticated ? `Hello, ${userDisplayName}` : 'Book Your Table'}
        </h1>
        <p className="text-sm text-[var(--sv-text-muted)] leading-relaxed">
          {isAuthenticated
            ? 'Scan your table QR to start ordering — checkout is seamless for signed-in members.'
            : 'Scan the QR on your table to browse the menu. Sign in when you open your cart to checkout.'}
        </p>
      </div>

      <div ref={cardsRef} className="space-y-4">
        <SavoriaBrandedQrScanCard
          restaurantName={restaurant?.name || 'Savoria'}
          hint="Tap to scan your table QR"
          onClick={openScan}
        />

        {hasTable && (
          <div className="sv-glass rounded-2xl p-4 flex items-center gap-3">
            <FiMapPin className="text-[var(--sv-accent)]" size={20} />
            <div className="flex-1">
              <p className="text-xs text-[var(--sv-text-muted)]">Linked table</p>
              <p className="font-bold text-[var(--sv-text)]">Table {restaurant.tableNumber}</p>
            </div>
            <button type="button" onClick={() => navigate('/order/menu')} className="sv-btn-primary text-sm py-2 px-4">
              Menu
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/order/menu')}
            className="sv-glass rounded-2xl p-4 text-left hover:border-[var(--sv-accent)] transition-colors"
          >
            <FiShoppingBag className="text-[var(--sv-accent)] mb-2" size={22} />
            <p className="font-semibold text-sm text-[var(--sv-text)]">Browse Menu</p>
            <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5">{totals.itemCount} in cart</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/order/history')}
            className="sv-glass rounded-2xl p-4 text-left hover:border-[var(--sv-accent)] transition-colors"
          >
            <FiClock className="text-[var(--sv-accent)] mb-2" size={22} />
            <p className="font-semibold text-sm text-[var(--sv-text)]">Order History</p>
            <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5">{orders.length} orders</p>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="sv-glass rounded-2xl p-4">
            <FiPackage className="text-[var(--sv-accent)] mb-2" size={20} />
            <p className="text-xl font-bold text-[var(--sv-text)]">{orders.length}</p>
            <p className="text-[10px] text-[var(--sv-text-muted)] uppercase tracking-wide">Total orders</p>
          </div>
          <div className="sv-glass rounded-2xl p-4">
            <FiClock className="text-amber-400 mb-2" size={20} />
            <p className="text-xl font-bold text-[var(--sv-text)]">{pendingOrders}</p>
            <p className="text-[10px] text-[var(--sv-text-muted)] uppercase tracking-wide">Active orders</p>
          </div>
        </div>

        {orders.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/order/history')}
            className="w-full sv-glass rounded-2xl p-4 flex items-center justify-between hover:border-[var(--sv-accent)] transition-colors"
          >
            <div className="text-left">
              <p className="font-semibold text-sm text-[var(--sv-text)]">View all orders</p>
              <p className="text-[10px] text-[var(--sv-text-muted)]">Track status and past bills</p>
            </div>
            <FiArrowRight className="text-[var(--sv-accent)]" />
          </button>
        )}
      </div>

      <SavoriaQrScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
      />
    </div>
  )
}
