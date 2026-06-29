import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiX, FiTag, FiMapPin, FiShoppingBag } from 'react-icons/fi'
import { gsap } from '../../utils/gsapSetup'
import CartLineItem from './CartLineItem'

export default function UserCartPanel({
  open,
  onClose,
  items,
  itemCount,
  table,
  tableToken,
  guestName,
  phone,
  onGuestNameChange,
  onPhoneChange,
  couponInput,
  onCouponInputChange,
  appliedCoupon,
  couponLoading,
  onApplyCoupon,
  onRemoveCoupon,
  specialInstructions,
  onInstructionsChange,
  subtotal,
  tax,
  service,
  couponDiscount,
  welcomeDiscount,
  total,
  previewLoading,
  placing,
  onCheckout,
  tablesPath,
}) {
  const panelRef = useRef(null)
  const headerRef = useRef(null)
  const itemsRef = useRef(null)
  const summaryRef = useRef(null)
  const couponRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' })
      gsap.fromTo(headerRef.current, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.1 })
      if (itemsRef.current?.children?.length) {
        gsap.fromTo(
          itemsRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, delay: 0.15, ease: 'power2.out' },
        )
      }
      gsap.fromTo(summaryRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: 0.2 })
    })

    return () => ctx.revert()
  }, [open, items.length])

  useEffect(() => {
    if (!open || !appliedCoupon) return
    gsap.fromTo(couponRef.current, { scale: 0.95, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' })
  }, [open, appliedCoupon?.code])

  if (!open) return null

  const tableNo = table?.tableNumber || table?.label
  const inputClass = 'w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end lg:items-center lg:justify-center p-0 lg:p-6"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full lg:max-w-5xl max-h-[94vh] lg:max-h-[92vh] overflow-hidden flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-t-3xl lg:rounded-3xl border border-white/10 shadow-2xl shadow-emerald-500/10"
      >
        <div ref={headerRef} className="shrink-0 border-b border-white/10 bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-5 py-5 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <FiShoppingBag className="text-emerald-400" size={22} />
              </div>
              <div>
                <h2 className="font-bold text-xl lg:text-2xl text-white">Your cart</h2>
                <p className="text-sm text-white/40 mt-0.5">{itemCount} item{itemCount !== 1 ? 's' : ''} in order</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10"
            >
              <FiX size={20} />
            </button>
          </div>

          {tableNo ? (
            <div className="mx-5 lg:mx-8 mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30">
              <p className="text-lg font-bold text-white flex items-center gap-2">
                <FiMapPin className="text-emerald-400 shrink-0" size={18} />
                Table {tableNo}
              </p>
            </div>
          ) : (
            <div className="mx-5 lg:mx-8 mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <p className="text-amber-200 font-medium">No table linked</p>
              {tablesPath && (
                <Link to={tablesPath} className="inline-block mt-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                  Book a table →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-8 lg:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Order items</h3>
              <div ref={itemsRef} className="space-y-4">
                {items.length === 0 ? (
                  <div className="p-10 rounded-2xl border border-dashed border-white/10 text-center text-white/40 text-sm">
                    Your cart is empty
                  </div>
                ) : (
                  items.map((item) => (
                    <CartLineItem
                      key={item.menuItem}
                      item={item}
                      large
                      onDecrease={item.onDecrease}
                      onIncrease={item.onIncrease}
                      onRemove={item.onRemove}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-5 lg:sticky lg:top-0 lg:self-start">
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/35">Your details</h3>
                <input
                  value={guestName}
                  onChange={(e) => onGuestNameChange(e.target.value)}
                  placeholder="Your name *"
                  className={inputClass}
                />
                <input
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="Mobile number *"
                  className={inputClass}
                />
                <textarea
                  value={specialInstructions}
                  onChange={(e) => onInstructionsChange(e.target.value)}
                  placeholder="Special instructions (optional)"
                  className={`${inputClass} resize-none`}
                  rows={3}
                />
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
                <label className="text-xs font-bold uppercase tracking-widest text-white/35 mb-3 flex items-center gap-1.5">
                  <FiTag size={13} /> Coupon
                </label>
                {appliedCoupon ? (
                  <div ref={couponRef} className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                    <div>
                      <p className="text-base font-semibold text-emerald-300">{appliedCoupon.code}</p>
                      <p className="text-sm text-white/45 mt-0.5">−₹{appliedCoupon.discountAmount ?? couponDiscount} applied</p>
                    </div>
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input
                      value={couponInput}
                      onChange={(e) => onCouponInputChange(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className={`${inputClass} uppercase`}
                    />
                    <button
                      type="button"
                      onClick={onApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="shrink-0 px-5 py-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <div ref={summaryRef} className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 space-y-3 text-sm lg:text-base">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-1">Bill summary</h3>
                <div className="flex justify-between text-white/50"><span>Subtotal</span><span className="tabular-nums">₹{subtotal}</span></div>
                <div className="flex justify-between text-white/50"><span>GST</span><span className="tabular-nums">₹{tax}</span></div>
                {service > 0 && <div className="flex justify-between text-white/50"><span>Service</span><span className="tabular-nums">₹{service}</span></div>}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span className="tabular-nums">−₹{couponDiscount}</span>
                  </div>
                )}
                {welcomeDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Welcome discount</span>
                    <span className="tabular-nums">−₹{welcomeDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-white/10">
                  <span>Final amount</span>
                  <span className="text-emerald-400 tabular-nums">₹{total}</span>
                </div>
                {previewLoading && <p className="text-xs text-white/30 text-center">Updating totals…</p>}
              </div>

              <button
                type="button"
                onClick={onCheckout}
                disabled={placing || !items.length}
                className="w-full py-4 lg:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-base disabled:opacity-50 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
              >
                {placing ? 'Placing order...' : 'Proceed to UPI payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
