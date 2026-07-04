import { useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import {
  FiShoppingBag, FiClock, FiArrowRight, FiMapPin, FiPackage, FiUser,
  FiMaximize2, FiCreditCard, FiChevronRight,
} from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import SavoriaBrandedQrScanCard from '../../components/savoria/SavoriaBrandedQrScanCard'

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'ready'])

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function formatMoney(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

export default function SavoriaUserDashboard() {
  const navigate = useNavigate()
  const {
    restaurant, session, totals, orders, isAuthenticated, userDisplayName,
    refreshSession, paths, requireAuth,
  } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()

  const rootRef = useRef(null)
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const actionsRef = useRef(null)
  const ordersRef = useRef(null)
  const cartBarRef = useRef(null)

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo('.ud-glow', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, stagger: 0.15 })
        .fromTo(heroRef.current, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.9')
        .fromTo('.ud-hero-badge', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' }, '-=0.45')
        .fromTo(statsRef.current?.children || [], { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5 }, '-=0.35')
        .fromTo(actionsRef.current?.children || [], { opacity: 0, y: 20, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.42 }, '-=0.25')

      if (ordersRef.current?.children?.length) {
        tl.fromTo(ordersRef.current.children, { opacity: 0, x: -16 }, { opacity: 1, x: 0, stagger: 0.07, duration: 0.38 }, '-=0.15')
      }

      if (cartBarRef.current) {
        tl.fromTo(cartBarRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' }, '-=0.2')
      }

      gsap.to('.ud-scan-pulse', {
        scale: 1.03,
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, rootRef)

    return () => ctx.revert()
  }, [orders.length, totals.itemCount])

  const hasTable = Boolean(session.qrLinked || session.tableToken)
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.has(o.status))
  const menuPath = withQuery(paths.menu)
  const cartPath = withQuery(paths.cart)
  const checkoutPath = withQuery(paths.checkout)

  const goMenu = () => navigate(hasTable ? menuPath : '/order/scan')
  const goCheckout = () => {
    if (!isAuthenticated) {
      requireAuth(checkoutPath)
      return
    }
    navigate(checkoutPath)
  }

  return (
    <div ref={rootRef} className="user-dashboard sv-page relative overflow-hidden">
      <div className="ud-glow ud-glow--gold pointer-events-none absolute -top-24 -right-16 w-56 h-56 rounded-full blur-3xl opacity-40" />
      <div className="ud-glow ud-glow--emerald pointer-events-none absolute top-1/3 -left-20 w-48 h-48 rounded-full blur-3xl opacity-30" />

      <div className="relative z-10 px-4 sm:px-6 pt-6 sm:pt-8 pb-28 max-w-lg mx-auto">
        <header ref={heroRef} className="text-center mb-6 sm:mb-8">
          <span className="ud-hero-badge sv-badge mb-3 sm:mb-4 inline-block">
            {isAuthenticated ? 'Member' : 'Guest'}
          </span>
          <h1 className="sv-display text-2xl sm:text-3xl font-bold text-[var(--sv-text)] mb-2 leading-tight">
            {isAuthenticated ? `Hello, ${userDisplayName}` : 'Welcome'}
          </h1>
          <p className="text-sm text-[var(--sv-text-muted)] leading-relaxed max-w-sm mx-auto px-1">
            {hasTable
              ? `You're at ${restaurant?.name || 'your table'}. Browse the menu and order — sign in only at checkout.`
              : 'Scan your table QR to unlock the menu and start ordering.'}
          </p>
        </header>

        <div ref={statsRef} className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <div className="ud-stat sv-glass rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl font-bold text-[var(--sv-accent)]">{totals.itemCount}</p>
            <p className="text-[10px] sm:text-xs text-[var(--sv-text-muted)] mt-0.5">Cart items</p>
          </div>
          <div className="ud-stat sv-glass rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl font-bold text-emerald-400">{activeOrders.length}</p>
            <p className="text-[10px] sm:text-xs text-[var(--sv-text-muted)] mt-0.5">Active</p>
          </div>
          <div className="ud-stat sv-glass rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl font-bold text-[var(--sv-text)]">{orders.length}</p>
            <p className="text-[10px] sm:text-xs text-[var(--sv-text-muted)] mt-0.5">Orders</p>
          </div>
        </div>

        {hasTable ? (
          <div className="ud-table-card sv-glass rounded-2xl p-4 mb-5 flex items-center gap-3 border border-emerald-500/20">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <FiMapPin className="text-emerald-400" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--sv-text-muted)]">Your table</p>
              <p className="font-bold text-[var(--sv-text)] truncate text-sm sm:text-base">
                {restaurant?.name} · Table {restaurant.tableNumber || session.tableNumber}
              </p>
            </div>
            <button type="button" onClick={goMenu} className="sv-btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0">
              Order
            </button>
          </div>
        ) : (
          <div className="ud-scan-pulse mb-6 flex justify-center">
            <SavoriaBrandedQrScanCard
              restaurantName={restaurant?.name || session.restaurantName || 'Savoria'}
              hint="Tap to scan your table QR"
              onClick={() => navigate('/order/scan')}
            />
          </div>
        )}

        <div ref={actionsRef} className="space-y-3">
          <button
            type="button"
            onClick={goMenu}
            className="ud-action ud-action--primary w-full sv-glass rounded-2xl p-4 flex items-center gap-4 text-left"
          >
            <span className="ud-action-icon ud-action-icon--gold">
              <FiShoppingBag size={22} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-semibold text-[var(--sv-text)] block">Browse Menu</span>
              <span className="text-[11px] text-[var(--sv-text-muted)]">
                {hasTable ? 'Dishes from this restaurant' : 'Scan QR to unlock'}
              </span>
            </span>
            <FiChevronRight className="text-[var(--sv-accent)] shrink-0" size={20} />
          </button>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(cartPath)}
              disabled={totals.itemCount === 0}
              className="ud-action sv-glass rounded-2xl p-3.5 sm:p-4 text-left disabled:opacity-45"
            >
              <FiCreditCard className="text-[var(--sv-accent)] mb-2" size={20} />
              <p className="font-semibold text-sm text-[var(--sv-text)]">Cart</p>
              <p className="text-[10px] text-[var(--sv-text-muted)]">{formatMoney(totals.subtotal)}</p>
            </button>
            <button
              type="button"
              onClick={() => navigate(withQuery('/order/active'))}
              className="ud-action sv-glass rounded-2xl p-3.5 sm:p-4 text-left"
            >
              <FiPackage className="text-emerald-400 mb-2" size={20} />
              <p className="font-semibold text-sm text-[var(--sv-text)]">Active</p>
              <p className="text-[10px] text-[var(--sv-text-muted)]">{activeOrders.length} in progress</p>
            </button>
            <button
              type="button"
              onClick={() => navigate(withQuery('/order/history'))}
              className="ud-action sv-glass rounded-2xl p-3.5 sm:p-4 text-left"
            >
              <FiClock className="text-[var(--sv-accent)] mb-2" size={20} />
              <p className="font-semibold text-sm text-[var(--sv-text)]">History</p>
              <p className="text-[10px] text-[var(--sv-text-muted)]">{orders.length} orders</p>
            </button>
            <button
              type="button"
              onClick={() => navigate('/order/scan')}
              className="ud-action sv-glass rounded-2xl p-3.5 sm:p-4 text-left"
            >
              <FiMaximize2 className="text-emerald-400 mb-2" size={20} />
              <p className="font-semibold text-sm text-[var(--sv-text)]">Scan QR</p>
              <p className="text-[10px] text-[var(--sv-text-muted)]">Link table</p>
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate(withQuery('/order/settings'))}
            className="ud-action w-full sv-glass rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="ud-action-icon">
                <FiUser size={18} />
              </span>
              <div className="text-left">
                <p className="font-semibold text-sm text-[var(--sv-text)]">Profile &amp; settings</p>
                <p className="text-[10px] text-[var(--sv-text-muted)]">
                  {isAuthenticated ? 'Manage your account' : 'Sign in for faster checkout'}
                </p>
              </div>
            </div>
            <FiArrowRight className="text-[var(--sv-accent)]" size={18} />
          </button>
        </div>

        {activeOrders.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h2 className="text-sm font-semibold text-[var(--sv-text)]">Live orders</h2>
              <button
                type="button"
                onClick={() => navigate(withQuery('/order/active'))}
                className="text-[11px] text-[var(--sv-accent)] font-medium"
              >
                View all
              </button>
            </div>
            <div ref={ordersRef} className="space-y-2">
              {activeOrders.slice(0, 3).map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => navigate(withQuery(`/order/orders/${order.id}`))}
                  className="ud-order-row w-full sv-glass rounded-xl p-3.5 flex items-center gap-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--sv-text)] truncate">
                      {order.items?.length ? `${order.items.length} items` : 'Order'} · {formatMoney(order.grandTotal)}
                    </p>
                    <p className="text-[10px] text-[var(--sv-text-muted)]">
                      Table {order.tableNumber || restaurant.tableNumber || '—'} · {STATUS_LABEL[order.status] || order.status}
                    </p>
                  </div>
                  <FiChevronRight className="text-[var(--sv-text-muted)] shrink-0" size={16} />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {totals.itemCount > 0 && (
        <div
          ref={cartBarRef}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-4 sm:px-6 pointer-events-none lg:bottom-6"
        >
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={goCheckout}
              className="ud-cart-bar w-full sv-btn-primary py-3.5 px-5 flex items-center justify-between shadow-lg"
            >
              <span className="text-sm font-semibold">
                {totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''} · {formatMoney(totals.total)}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold">
                Checkout <FiArrowRight size={16} />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
