import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { FiShoppingBag, FiClock, FiArrowRight, FiMapPin, FiPackage, FiUser } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import SavoriaQrScanModal from '../../components/savoria/SavoriaQrScanModal'
import SavoriaBrandedQrScanCard from '../../components/savoria/SavoriaBrandedQrScanCard'

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'ready'])

export default function SavoriaUserDashboard() {
  const navigate = useNavigate()
  const {
    restaurant, session, totals, orders, isAuthenticated, userDisplayName, refreshSession, paths,
  } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()
  const [scanOpen, setScanOpen] = useState(false)
  const heroRef = useRef(null)
  const cardsRef = useRef(null)

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(heroRef.current, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.65 })
      .fromTo(cardsRef.current?.children || [],
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.45 },
        '-=0.35',
      )
  }, [])

  const hasTable = Boolean(session.qrLinked || session.tableToken)
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.has(o.status))
  const menuPath = withQuery(paths.menu)

  return (
    <div className="min-h-[100dvh] px-4 py-8 pb-24 max-w-lg mx-auto">
      <div ref={heroRef} className="text-center mb-8">
        <span className="sv-badge mb-4 inline-block">
          {isAuthenticated ? 'Member' : 'Guest'}
        </span>
        <h1 className="sv-display text-3xl font-bold text-[var(--sv-text)] mb-2">
          {isAuthenticated ? `Hello, ${userDisplayName}` : 'Welcome'}
        </h1>
        <p className="text-sm text-[var(--sv-text-muted)] leading-relaxed">
          {hasTable
            ? `Ordering at ${restaurant?.name || 'your table'} — browse freely and sign in only when you pay.`
            : 'Scan your table QR to open the menu. No login needed until checkout.'}
        </p>
      </div>

      <div ref={cardsRef} className="space-y-4">
        {!hasTable && (
          <SavoriaBrandedQrScanCard
            restaurantName={restaurant?.name || 'Savoria'}
            hint="Tap to scan your table QR"
            onClick={() => setScanOpen(true)}
          />
        )}

        {hasTable && (
          <div className="sv-glass rounded-2xl p-4 flex items-center gap-3">
            <FiMapPin className="text-[var(--sv-accent)]" size={20} />
            <div className="flex-1">
              <p className="text-xs text-[var(--sv-text-muted)]">Linked table</p>
              <p className="font-bold text-[var(--sv-text)]">
                {restaurant?.name} · Table {restaurant.tableNumber}
              </p>
            </div>
            <button type="button" onClick={() => navigate(menuPath)} className="sv-btn-primary text-sm py-2 px-4">
              Menu
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate(hasTable ? menuPath : '/scan')}
            className="sv-glass rounded-2xl p-4 text-left hover:border-[var(--sv-accent)] transition-colors"
          >
            <FiShoppingBag className="text-[var(--sv-accent)] mb-2" size={22} />
            <p className="font-semibold text-sm text-[var(--sv-text)]">Browse Menu</p>
            <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5">{totals.itemCount} in cart</p>
          </button>
          <button
            type="button"
            onClick={() => navigate(withQuery('/order/active'))}
            className="sv-glass rounded-2xl p-4 text-left hover:border-[var(--sv-accent)] transition-colors"
          >
            <FiPackage className="text-[var(--sv-accent)] mb-2" size={22} />
            <p className="font-semibold text-sm text-[var(--sv-text)]">Active Orders</p>
            <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5">{activeOrders.length} in progress</p>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate(withQuery('/order/history'))}
            className="sv-glass rounded-2xl p-4 text-left hover:border-[var(--sv-accent)] transition-colors"
          >
            <FiClock className="text-[var(--sv-accent)] mb-2" size={22} />
            <p className="font-semibold text-sm text-[var(--sv-text)]">Order History</p>
            <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5">{orders.length} total</p>
          </button>
          <button
            type="button"
            onClick={() => navigate(withQuery('/order/settings'))}
            className="sv-glass rounded-2xl p-4 text-left hover:border-[var(--sv-accent)] transition-colors"
          >
            <FiUser className="text-[var(--sv-accent)] mb-2" size={22} />
            <p className="font-semibold text-sm text-[var(--sv-text)]">Profile</p>
            <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5">Account settings</p>
          </button>
        </div>

        {orders.length > 0 && (
          <button
            type="button"
            onClick={() => navigate(withQuery('/order/history'))}
            className="w-full sv-glass rounded-2xl p-4 flex items-center justify-between hover:border-[var(--sv-accent)] transition-colors"
          >
            <div className="text-left">
              <p className="font-semibold text-sm text-[var(--sv-text)]">View order history</p>
              <p className="text-[10px] text-[var(--sv-text-muted)]">Details, tracking, and reorder</p>
            </div>
            <FiArrowRight className="text-[var(--sv-accent)]" />
          </button>
        )}
      </div>

      <SavoriaQrScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </div>
  )
}
