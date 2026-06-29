import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'

export default function SavoriaStickyCartBar() {
  const { totals, requireAuth, isAuthenticated } = useSavoriaGuest()
  const navigate = useNavigate()
  const location = useLocation()

  if (totals.itemCount === 0) return null
  if (location.pathname.includes('/cart') || location.pathname.includes('/checkout')) return null

  const handleViewCart = () => {
    if (isAuthenticated) {
      navigate('/order/cart')
      return
    }
    requireAuth('/order/cart')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="sv-sticky-bar"
      >
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          <div>
            <p className="text-xs text-[var(--sv-text-muted)]">{totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''}</p>
            <p className="font-bold text-lg text-[var(--sv-text)]">₹{totals.grandTotal}</p>
          </div>
          <button type="button" onClick={handleViewCart} className="sv-btn-primary px-8">
            View Cart
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
