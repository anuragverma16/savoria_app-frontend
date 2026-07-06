import { useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { FiShoppingBag } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import SavoriaCartLineItem from '../../components/savoria/SavoriaCartLineItem'
import OrderPanelActionBar from '../../components/savoria/OrderPanelActionBar'
import CustomerOrderSteps from '../../components/savoria/CustomerOrderSteps'

export default function SavoriaCartPage() {
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const { withQuery } = useOrderPanelQuery()
  const {
    cart, totals, updateCartQty, removeFromCart, restaurant, paths,
    isAuthenticated,
  } = useSavoriaGuest()

  const menuPath = withQuery(paths.menu)
  const checkoutPath = withQuery(paths.checkout)

  useLayoutEffect(() => {
    const el = mainRef.current
    if (!el || !cart.length) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.sv-cart-line'),
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' },
      )
      gsap.fromTo(
        el.querySelectorAll('.sv-cart-summary'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, delay: 0.1, ease: 'power2.out' },
      )
    }, el)
    return () => ctx.revert()
  }, [cart.length])

  const handleCheckout = () => {
    navigate(checkoutPath)
  }

  if (cart.length === 0) {
    return (
      <div className="sv-page min-h-[80dvh] flex flex-col px-4 py-6 max-w-lg mx-auto">
        <CustomerOrderSteps step={1} />
        <OrderPanelActionBar active="cart" />
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-8 sv-empty-state">
          <div className="sv-empty-state-icon">
            <FiShoppingBag size={28} />
          </div>
          <h2 className="sv-display text-xl font-bold text-[var(--sv-text)] mb-2">Your cart is empty</h2>
          <p className="text-sm text-[var(--sv-text-muted)] mb-6 max-w-xs">Pick something delicious from the menu. You only sign in when you pay.</p>
          <button type="button" onClick={() => navigate(menuPath)} className="sv-btn-primary">
            Browse Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sv-page pb-28 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 sv-glass border-b border-[var(--sv-border)]/60 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="sv-display font-bold text-lg text-[var(--sv-text)]">Your Cart</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--sv-accent-glow)] text-[var(--sv-accent)] border border-[var(--sv-accent)]/25">
            {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        <CustomerOrderSteps step={2} />
        <OrderPanelActionBar active="cart" />
      </div>

      <main ref={mainRef} className="px-4 py-4 space-y-3">
        {!isAuthenticated && (
          <div className="sv-guest-hint">
            <span className="sv-guest-hint-icon" aria-hidden>✨</span>
            <div>
              <p className="text-sm font-semibold text-[var(--sv-text)]">Guest checkout</p>
              <p className="text-xs text-[var(--sv-text-muted)] mt-0.5 leading-relaxed">
                Review your order now — quick OTP login only when you tap Pay.
              </p>
            </div>
          </div>
        )}

        <div className="sv-section-card">
          <p className="text-xs text-[var(--sv-text-muted)] uppercase tracking-wider">Ordering from</p>
          <p className="font-bold text-[var(--sv-text)]">{restaurant.name}</p>
          {restaurant.tableNumber && (
            <p className="text-sm text-[var(--sv-accent)]">Table {restaurant.tableNumber}</p>
          )}
        </div>

        {cart.map((line) => (
          <div key={line.id} className="sv-cart-line">
            <SavoriaCartLineItem
              line={line}
              onUpdateQty={updateCartQty}
              onRemove={removeFromCart}
            />
          </div>
        ))}

        <div className="sv-cart-summary sv-glass rounded-2xl p-5 mt-4 space-y-3">
          <h3 className="font-semibold text-[var(--sv-text)]">Bill Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--sv-text-muted)]">Subtotal</span>
            <span>₹{totals.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--sv-text-muted)]">GST</span>
            <span>₹{totals.gst}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-[var(--sv-success)]">
              <span>Discount</span>
              <span>-₹{totals.discount}</span>
            </div>
          )}
          <div className="border-t border-[var(--sv-border)] pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-[var(--sv-accent)]">₹{totals.total}</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 sv-sticky-bar sv-sticky-bar--cart md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-2xl">
        <button type="button" onClick={handleCheckout} className="sv-btn-primary w-full py-3.5 text-base">
          Proceed to Checkout · ₹{totals.total}
        </button>
      </div>
    </div>
  )
}
