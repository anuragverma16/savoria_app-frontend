import { FiCheck, FiTag, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { filterActiveCoupons, formatCouponDiscount, formatCouponValidUntil } from '../../utils/couponDisplay'

export default function MenuPromoCoupons({
  coupons = [],
  subtotal = 0,
  appliedCoupon,
  couponLoading = false,
  onApply,
  onRemove,
  showManualInput = false,
  manualCode = '',
  onManualCodeChange,
  onManualApply,
}) {
  const activeCoupons = filterActiveCoupons(coupons)
  const appliedValid = appliedCoupon && filterActiveCoupons([appliedCoupon]).length > 0
    ? appliedCoupon
    : null

  if (!activeCoupons.length && !appliedValid && !showManualInput) return null

  const handleApply = async (code) => {
    const coupon = activeCoupons.find((c) => c.code === code)
    const minOrder = coupon?.minOrder || 0
    if (minOrder > 0 && subtotal < minOrder) {
      toast.error(`Add ₹${minOrder - subtotal} more to use this coupon (min ₹${minOrder})`)
      return
    }
    if (!subtotal) {
      toast.error('Add items to your cart first')
      return
    }
    try {
      await onApply?.(code)
      toast.success(`Coupon ${code} applied`)
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Could not apply coupon')
    }
  }

  return (
    <section className="sv-section-card !p-3.5">
      <h2 className="sv-section-title text-sm mb-2.5">
        <FiTag size={15} /> {showManualInput ? 'Apply coupon' : 'Offers'}
      </h2>

      {appliedValid ? (
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--sv-text)] flex items-center gap-1.5">
              <FiCheck className="text-emerald-400 shrink-0" size={14} />
              {appliedValid.code}
            </p>
            <p className="text-[11px] text-[var(--sv-text-muted)] mt-0.5">
              −₹{appliedValid.discountAmount || appliedValid.amount || 0} applied
              {appliedValid.minOrder > 0 ? ` · min ₹${appliedValid.minOrder}` : ''}
              {formatCouponValidUntil(appliedValid.expiresAt)
                ? ` · till ${formatCouponValidUntil(appliedValid.expiresAt)}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="sv-btn-ghost py-1.5 px-2.5 text-xs shrink-0"
            aria-label="Remove coupon"
          >
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <>
          {activeCoupons.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide snap-x snap-mandatory">
              {activeCoupons.map((coupon) => {
                const minOrder = coupon.minOrder || 0
                const eligible = subtotal >= minOrder
                const shortfall = minOrder > subtotal ? minOrder - subtotal : 0
                const validUntil = formatCouponValidUntil(coupon.expiresAt)
                return (
                  <button
                    key={coupon.code}
                    type="button"
                    disabled={couponLoading}
                    onClick={() => handleApply(coupon.code)}
                    className={`snap-start shrink-0 min-w-[9.5rem] max-w-[11rem] text-left p-3 rounded-xl border transition-colors ${
                      eligible
                        ? 'border-[var(--sv-accent)]/35 bg-[var(--sv-accent-glow)] hover:border-[var(--sv-accent)]/55'
                        : 'border-[var(--sv-border)] bg-[var(--sv-surface)] opacity-90'
                    }`}
                  >
                    <p className="text-xs font-bold text-[var(--sv-accent)] tracking-wide">{coupon.code}</p>
                    <p className="text-[11px] font-semibold text-[var(--sv-text)] mt-1">{formatCouponDiscount(coupon)}</p>
                    {minOrder > 0 ? (
                      <p className="text-[10px] text-[var(--sv-text-muted)] mt-1">
                        {eligible ? `Min ₹${minOrder} met` : `Min ₹${minOrder} · add ₹${shortfall}`}
                      </p>
                    ) : (
                      <p className="text-[10px] text-[var(--sv-text-muted)] mt-1">Tap to apply</p>
                    )}
                    {validUntil && (
                      <p className="text-[10px] text-emerald-400/90 mt-0.5">Valid till {validUntil}</p>
                    )}
                    {coupon.description ? (
                      <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5 line-clamp-2">{coupon.description}</p>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}

          {showManualInput && (
            <div className={`flex gap-2 ${activeCoupons.length ? 'mt-3' : ''}`}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => onManualCodeChange?.(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="sv-input flex-1 text-sm"
              />
              <button
                type="button"
                disabled={couponLoading || !manualCode.trim()}
                onClick={onManualApply}
                className="sv-btn-ghost px-4 flex-shrink-0 text-sm"
              >
                {couponLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
