import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiMinus, FiPlus, FiStar } from 'react-icons/fi'
import { GiChiliPepper } from 'react-icons/gi'
import toast from 'react-hot-toast'
import OptimizedImage from '../OptimizedImage'

export default function SavoriaFoodDetailModal({ item, open, onClose, onAdd }) {
  const [qty, setQty] = useState(1)
  const modalRef = useRef(null)

  useEffect(() => {
    if (open) setQty(1)
  }, [open, item?.id])

  const handleAdd = () => {
    onAdd(item, qty)
    toast.success(`${item.name} added to cart`)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sv-modal-overlay"
            onClick={onClose}
          />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[92dvh] overflow-hidden rounded-t-3xl sv-glass-solid md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:rounded-3xl md:max-h-[85vh]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full sv-glass flex items-center justify-center"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>

            <div className="overflow-y-auto max-h-[92dvh] md:max-h-[85vh]">
              <div className="relative aspect-[16/10]">
                <OptimizedImage src={item.image} alt={item.name} width={640} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--sv-surface-solid)] via-transparent to-transparent" />
              </div>

              <div className="p-5 -mt-8 relative">
                <div className="flex flex-wrap gap-2 mb-2">
                  {item.tags?.map((tag) => (
                    <span key={tag} className="sv-badge">{tag}</span>
                  ))}
                  {item.spicy && (
                    <span className="sv-badge flex items-center gap-1 text-red-500 border-red-300">
                      <GiChiliPepper size={12} /> Spicy
                    </span>
                  )}
                </div>

                <h2 className="sv-display text-2xl font-bold text-[var(--sv-text)] mb-1">{item.name}</h2>
                <div className="flex items-center gap-3 text-sm text-[var(--sv-text-muted)] mb-3">
                  <span className="flex items-center gap-1 text-amber-500">
                    <FiStar size={14} fill="currentColor" /> {item.rating}
                  </span>
                  <span>· {item.prepTime} min prep</span>
                </div>
                <p className="text-[var(--sv-text-muted)] text-sm leading-relaxed mb-5">{item.description}</p>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sv-glass rounded-full px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--sv-accent-glow)]"
                    >
                      <FiMinus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--sv-accent-glow)]"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                  <button type="button" onClick={handleAdd} className="sv-btn-primary flex-1">
                    Add · ₹{item.price * qty}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
