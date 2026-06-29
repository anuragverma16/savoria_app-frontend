import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiTag, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import SavoriaPaymentSelector from '../../components/savoria/SavoriaPaymentSelector'
import { DEMO_COUPONS } from '../../data/savoriaMenuData'
import { GST_RATE } from '../../contexts/SavoriaGuestContext'

export default function SavoriaCheckoutPage() {
  const navigate = useNavigate()
  const {
    cart, totals, auth, restaurant, appliedCoupon, setAppliedCoupon, placeOrder,
  } = useSavoriaGuest()

  const [couponInput, setCouponInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [customerName, setCustomerName] = useState(auth?.name || '')
  const [processing, setProcessing] = useState(false)

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    const coupon = DEMO_COUPONS[code]
    if (!coupon) {
      toast.error('Invalid coupon code')
      return
    }
    if (totals.subtotal < coupon.minOrder) {
      toast.error(`Minimum order ₹${coupon.minOrder} required`)
      return
    }
    const amount = Math.round(totals.subtotal * coupon.discountPercent / 100)
    setAppliedCoupon({ code, amount, percent: coupon.discountPercent })
    toast.success(`${code} applied — ${coupon.discountPercent}% off!`)
  }

  const finalTotal = Math.max(0, totals.subtotal + totals.gst - (appliedCoupon?.amount || 0))

  const handlePay = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter your name')
      return
    }
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 1500))
    const order = placeOrder({
      paymentMethod,
      customerName: customerName.trim(),
      customerPhone: auth?.phone,
    })
    setProcessing(false)
    navigate(`/order/success/${order.id}`, { state: { order } })
  }

  if (cart.length === 0) {
    navigate('/order/cart', { replace: true })
    return null
  }

  return (
    <div className="pb-28 max-w-lg mx-auto">
      <header className="sticky top-0 z-20 sv-glass px-4 py-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/order/cart')} className="sv-btn-ghost py-2 px-3">
          <FiArrowLeft size={18} />
        </button>
        <h1 className="sv-display font-bold text-lg flex-1">Checkout</h1>
      </header>

      <main className="px-4 py-4 space-y-5">
        <section className="sv-glass rounded-2xl p-4">
          <h2 className="font-semibold text-[var(--sv-text)] mb-3 flex items-center gap-2">
            <FiUser size={16} className="text-[var(--sv-accent)]" /> Customer Details
          </h2>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your name"
            className="sv-input mb-3"
          />
          <input
            type="tel"
            value={auth?.phone?.replace('+91', '') || ''}
            readOnly
            className="sv-input opacity-70"
            placeholder="Mobile number"
          />
        </section>

        <section className="sv-glass rounded-2xl p-4">
          <p className="text-xs text-[var(--sv-text-muted)] uppercase tracking-wider mb-1">Dine-in at</p>
          <p className="font-bold text-[var(--sv-text)]">{restaurant.name}</p>
          <p className="text-sm text-[var(--sv-accent)]">Table {restaurant.tableNumber}</p>
        </section>

        <section className="sv-glass rounded-2xl p-4">
          <h2 className="font-semibold text-[var(--sv-text)] mb-3">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {cart.map((line) => (
              <div key={line.id} className="flex justify-between text-sm">
                <span className="text-[var(--sv-text-muted)]">{line.qty}× {line.name}</span>
                <span className="text-[var(--sv-text)]">₹{line.price * line.qty}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--sv-border)] pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--sv-text-muted)]">Subtotal</span>
              <span>₹{totals.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--sv-text-muted)]">GST ({GST_RATE}%)</span>
              <span>₹{totals.gst}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-[var(--sv-success)]">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-₹{appliedCoupon.amount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total</span>
              <span className="text-[var(--sv-accent)]">₹{finalTotal}</span>
            </div>
          </div>
        </section>

        <section className="sv-glass rounded-2xl p-4">
          <h2 className="font-semibold text-[var(--sv-text)] mb-3 flex items-center gap-2">
            <FiTag size={16} className="text-[var(--sv-accent)]" /> Coupon Code
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              className="sv-input flex-1"
            />
            <button type="button" onClick={applyCoupon} className="sv-btn-ghost px-4 flex-shrink-0">
              Apply
            </button>
          </div>
          <p className="text-xs text-[var(--sv-text-muted)] mt-2">Try WELCOME10 or SAVORIA20</p>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--sv-text)] mb-3 px-1">Payment Method</h2>
          <SavoriaPaymentSelector selected={paymentMethod} onSelect={setPaymentMethod} />
        </section>
      </main>

      <div className="fixed bottom-0 inset-x-0 sv-sticky-bar md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-2xl">
        <button
          type="button"
          disabled={processing}
          onClick={handlePay}
          className="sv-btn-primary w-full py-3.5 disabled:opacity-60"
        >
          {processing ? 'Processing…' : `Pay ₹${finalTotal}`}
        </button>
      </div>
    </div>
  )
}
