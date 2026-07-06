import { useLayoutEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import {
  FiShoppingBag, FiClock, FiUser, FiPackage, FiShoppingCart,
} from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'

const ACTIONS = [
  { key: 'menu', label: 'Menu', icon: FiShoppingBag, segment: 'menu' },
  { key: 'cart', label: 'Cart', icon: FiShoppingCart, segment: 'cart', showBadge: true },
  { key: 'active', label: 'Active', icon: FiPackage, segment: 'active' },
  { key: 'history', label: 'History', icon: FiClock, segment: 'history' },
  { key: 'profile', label: 'Profile', icon: FiUser, segment: 'settings' },
]

/** In-page navigation for QR order flow (replaces bottom tab bar) */
export default function OrderPanelActionBar({ active = '' }) {
  const barRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { withQuery } = useOrderPanelQuery()
  const { totals, paths, isAuthenticated, requirePaymentAuth } = useSavoriaGuest()

  const resolveActive = (key) => {
    if (active) return active === key
    const path = location.pathname
    if (key === 'menu') return path.includes('/order/menu')
    if (key === 'cart') return path.includes('/order/cart')
    if (key === 'active') return path.includes('/order/active')
    if (key === 'history') return path.includes('/order/history') || path.includes('/order/orders')
    if (key === 'profile') return path.includes('/order/settings')
    return false
  }

  useLayoutEffect(() => {
    const el = barRef.current
    if (!el) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.op-action-btn'),
        { opacity: 0, y: 10, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.05, ease: 'back.out(1.6)' },
      )
    }, el)
    return () => ctx.revert()
  }, [location.pathname])

  const go = (item) => {
    const segmentMap = {
      menu: paths.menu,
      cart: paths.cart,
      active: paths.activeOrders,
      history: paths.orders,
      settings: paths.profile,
    }
    const target = withQuery(segmentMap[item.segment] || paths.menu)
    if (item.key === 'profile' && !isAuthenticated) {
      requirePaymentAuth(target)
      return
    }
    navigate(target)
  }

  return (
    <nav
      ref={barRef}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory"
      aria-label="Order panel actions"
    >
      {ACTIONS.map((item) => {
        const isActive = resolveActive(item.key)
        const badge = item.showBadge && totals.itemCount > 0 ? totals.itemCount : 0
        const Icon = item.icon
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => go(item)}
            aria-current={isActive ? 'page' : undefined}
            className={`op-action-btn relative flex flex-col items-center justify-center gap-1 min-w-[4.5rem] px-3 py-2.5 rounded-2xl border text-[10px] font-semibold uppercase tracking-wide shrink-0 transition-colors ${
              isActive
                ? 'is-active border-[var(--sv-accent)]/50 bg-[var(--sv-accent-glow)] text-[var(--sv-accent)]'
                : 'border-[var(--sv-border)] bg-[var(--sv-surface)] text-[var(--sv-text-muted)] hover:text-[var(--sv-text)] hover:border-[var(--sv-accent)]/30'
            }`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
            {badge > 0 && (
              <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-[var(--sv-accent)] text-[#1a1510] text-[9px] font-bold flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
