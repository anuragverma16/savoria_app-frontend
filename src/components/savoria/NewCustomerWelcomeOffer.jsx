import { FiGift } from 'react-icons/fi'

/** Banner for first-order 40% welcome discount */
export default function NewCustomerWelcomeOffer({ welcomePercent = 40, welcomeDiscount = 0, subtotal = 0 }) {
  const savings = welcomeDiscount > 0
    ? welcomeDiscount
    : Math.round(Math.max(0, subtotal) * welcomePercent / 100)

  return (
    <section className="sv-section-card !p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
          <FiGift className="text-emerald-400" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-0.5">New customer offer</p>
          <h3 className="font-bold text-[var(--sv-text)] text-base leading-tight">
            {welcomePercent}% OFF your first order
          </h3>
          <p className="text-xs text-[var(--sv-text-muted)] mt-1 leading-relaxed">
            Applied automatically at checkout — no coupon code needed.
            {subtotal > 0 && savings > 0 ? (
              <span className="block mt-1 text-emerald-400 font-semibold">You save ₹{savings} on this order</span>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  )
}
