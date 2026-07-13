import { useNavigate, useLocation } from 'react-router-dom'
import { FiShoppingCart } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'

export default function SavoriaStickyCartBar() {
  const { totals, paths } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()
  const navigate = useNavigate()
  const location = useLocation()

  if (totals.itemCount === 0) return null
  if (location.pathname.includes('/cart') || location.pathname.includes('/checkout')) return null

  const handleViewCart = () => {
    navigate(withQuery(paths.cart))
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="sv-sticky-bar sv-sticky-bar--cart md:hidden"
      >
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[var(--sv-accent-glow)] border border-[var(--sv-accent)]/30 flex items-center justify-center shrink-0 text-[var(--sv-accent)]">
              <FiShoppingCart size={20} />
            </div>
            <div className="sv-sticky-bar-cta min-w-0">
              <p className="text-xs text-[var(--sv-text-muted)] truncate">
                {totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''} in cart
              </p>
              <strong>₹{totals.total}</strong>
            </div>
          </div>
          <button type="button" onClick={handleViewCart} className="sv-btn-primary px-6 sm:px-8 shrink-0">
            View Cart
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
