import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import SavoriaCartLineItem from '../../components/savoria/SavoriaCartLineItem'
import { GST_RATE } from '../../contexts/SavoriaGuestContext'

export default function SavoriaCartPage() {
  const navigate = useNavigate()
  const {
    cart, totals, updateCartQty, removeFromCart, requireAuth, restaurant, isAuthenticated,
  } = useSavoriaGuest()

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/order/checkout')
      return
    }
    requireAuth('/order/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full sv-glass flex items-center justify-center mb-4">
          <FiShoppingBag size={32} className="text-[var(--sv-text-muted)]" />
        </div>
        <h2 className="sv-display text-xl font-bold text-[var(--sv-text)] mb-2">Your cart is empty</h2>
        <p className="text-sm text-[var(--sv-text-muted)] mb-6">Add delicious items from our menu to get started</p>
        <button type="button" onClick={() => navigate('/order/menu')} className="sv-btn-primary">
          Browse Menu
        </button>
      </div>
    )
  }

  return (
    <div className="pb-28 max-w-lg mx-auto">
      <header className="sticky top-0 z-20 sv-glass px-4 py-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/order/menu')} className="sv-btn-ghost py-2 px-3">
          <FiArrowLeft size={18} />
        </button>
        <h1 className="sv-display font-bold text-lg flex-1">Your Cart</h1>
        <span className="text-sm text-[var(--sv-text-muted)]">{totals.itemCount} items</span>
      </header>

      <main className="px-4 py-4 space-y-3">
        {cart.map((line) => (
          <motion.div
            key={line.id}
            layout
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
          >
            <SavoriaCartLineItem
              line={line}
              onUpdateQty={updateCartQty}
              onRemove={removeFromCart}
            />
          </motion.div>
        ))}

        <div className="sv-glass rounded-2xl p-5 mt-6 space-y-3">
          <h3 className="font-semibold text-[var(--sv-text)] mb-3">Bill Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--sv-text-muted)]">Subtotal</span>
            <span className="text-[var(--sv-text)]">₹{totals.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--sv-text-muted)]">GST ({GST_RATE}%)</span>
            <span className="text-[var(--sv-text)]">₹{totals.gst}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-[var(--sv-success)]">
              <span>Discount</span>
              <span>-₹{totals.discount}</span>
            </div>
          )}
          <div className="border-t border-[var(--sv-border)] pt-3 flex justify-between font-bold text-lg">
            <span className="text-[var(--sv-text)]">Grand Total</span>
            <span className="text-[var(--sv-accent)]">₹{totals.grandTotal}</span>
          </div>
          <p className="text-xs text-[var(--sv-text-muted)]">Table {restaurant.tableNumber} · Dine-in</p>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 sv-sticky-bar md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-2xl">
        <button type="button" onClick={handleCheckout} className="sv-btn-primary w-full py-3.5">
          Proceed to Checkout · ₹{totals.grandTotal}
        </button>
      </div>
    </div>
  )
}
