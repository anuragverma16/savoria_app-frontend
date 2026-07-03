import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiTag, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { restaurantAPI } from '../../api/dineflow'
import DineflowUpiPaymentModal from '../../components/dineflow/DineflowUpiPaymentModal'
import { downloadOrderInvoice } from '../../utils/generateInvoicePdf'

const RESUME_PAYMENT_KEY = 'savoria_resume_payment'

export default function SavoriaCheckoutPage() {
  const navigate = useNavigate()
  const {
    cart,
    totals,
    auth,
    restaurant,
    appliedCoupon,
    setAppliedCoupon,
    placeCustomerOrder,
    verifyUpiPayment,
    paths,
    rid,
    user,
    setLastPlacedOrderId,
    isAuthenticated,
    requireAuth,
  } = useSavoriaGuest()

  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [customerName, setCustomerName] = useState(auth?.name || user?.name || '')
  const [phone, setPhone] = useState(auth?.phone || user?.phone || '')
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    if (auth?.name) setCustomerName(auth.name)
    if (auth?.phone) setPhone(auth.phone)
  }, [auth])

  useEffect(() => {
    if (!isAuthenticated) return
    if (sessionStorage.getItem(RESUME_PAYMENT_KEY) !== '1') return
    sessionStorage.removeItem(RESUME_PAYMENT_KEY)
    if (auth?.name) setCustomerName(auth.name)
    if (auth?.phone) setPhone(auth.phone)
    setShowUpiModal(true)
  }, [isAuthenticated, auth])

  const applyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) {
      toast.error('Enter a coupon code')
      return
    }
    if (!rid) return
    setCouponLoading(true)
    try {
      const { data } = await restaurantAPI(rid).validateCoupon({ code, subtotal: totals.subtotal })
      setAppliedCoupon(data.coupon)
      toast.success(`${data.coupon.code} applied`)
    } catch (e) {
      setAppliedCoupon(null)
      toast.error(e.response?.data?.message || 'Invalid coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const handlePlaceOrder = async ({ paymentTxnId, paymentProof }) => {
    setPlacing(true)
    try {
      const order = await placeCustomerOrder({
        paymentTxnId,
        paymentProof,
        customerName: customerName.trim(),
        phone: phone.trim(),
        amount: totals.total,
      })
      setLastPlacedOrderId?.(order.id)
      await downloadOrderInvoice({
        order,
        restaurant,
        guestName: customerName.trim(),
        guestPhone: phone.trim(),
      }).catch(() => {})
      toast.success('Order placed successfully!')
      navigate(paths.orderSuccess(order.id), { state: { order } })
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Order failed')
      throw e
    } finally {
      setPlacing(false)
      setShowUpiModal(false)
    }
  }

  const handlePayClick = () => {
    if (!customerName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }
    if (!isAuthenticated) {
      sessionStorage.setItem(RESUME_PAYMENT_KEY, '1')
      requireAuth(paths.checkout, () => setShowUpiModal(true))
      return
    }
    setShowUpiModal(true)
  }

  if (cart.length === 0) {
    navigate(paths.cart, { replace: true })
    return null
  }

  return (
    <div className="pb-28 max-w-lg mx-auto">
      <header className="sticky top-0 z-20 sv-glass px-4 py-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate(paths.cart)} className="sv-btn-ghost py-2 px-3">
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="sv-input"
            placeholder="Mobile number"
          />
        </section>

        <section className="sv-glass rounded-2xl p-4">
          <p className="text-xs text-[var(--sv-text-muted)] uppercase tracking-wider mb-1">Dine-in at</p>
          <p className="font-bold text-[var(--sv-text)]">{restaurant.name}</p>
          {restaurant.tableNumber && (
            <p className="text-sm text-[var(--sv-accent)]">Table {restaurant.tableNumber}</p>
          )}
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
              <span className="text-[var(--sv-text-muted)]">GST</span>
              <span>₹{totals.gst}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-[var(--sv-success)]">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-₹{appliedCoupon.discountAmount || appliedCoupon.amount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total</span>
              <span className="text-[var(--sv-accent)]">₹{totals.total}</span>
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
              placeholder="Enter coupon"
              className="sv-input flex-1"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading}
              className="sv-btn-ghost px-4 flex-shrink-0"
            >
              {couponLoading ? '…' : 'Apply'}
            </button>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 inset-x-0 sv-sticky-bar md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-2xl">
        <button
          type="button"
          disabled={placing}
          onClick={handlePayClick}
          className="sv-btn-primary w-full py-3.5 disabled:opacity-60"
        >
          {placing ? 'Processing…' : `Pay ₹${totals.total}`}
        </button>
      </div>

      {showUpiModal && (
        <DineflowUpiPaymentModal
          amount={totals.total}
          upiId={restaurant.settings?.upiId}
          payeeName={restaurant.settings?.upiPayeeName || restaurant.name}
          tableNumber={restaurant.tableNumber}
          items={cart}
          appliedCoupon={appliedCoupon}
          subtotal={totals.subtotal}
          tax={totals.gst}
          serviceCharge={totals.service}
          couponDiscount={appliedCoupon?.discountAmount || appliedCoupon?.amount || 0}
          onConfirm={handlePlaceOrder}
          onVerify={verifyUpiPayment}
          onClose={() => setShowUpiModal(false)}
          placing={placing}
        />
      )}
    </div>
  )
}
