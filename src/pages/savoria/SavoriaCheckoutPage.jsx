import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import SavoriaRazorpayPaymentModal from '../../components/savoria/SavoriaRazorpayPaymentModal'
import CustomerOrderSteps from '../../components/savoria/CustomerOrderSteps'
import MenuPromoCoupons from '../../components/savoria/MenuPromoCoupons'
import NewCustomerWelcomeOffer from '../../components/savoria/NewCustomerWelcomeOffer'
import { downloadOrderInvoice } from '../../utils/generateInvoicePdf'
import { resolveCustomerFullName, resolveCustomerPhone } from '../../utils/customerDisplayName'

const RESUME_PAYMENT_KEY = 'savoria_resume_payment'

export default function SavoriaCheckoutPage() {
  const navigate = useNavigate()
  const {
    cart,
    totals,
    auth,
    restaurant,
    appliedCoupon,
    promoCoupons,
    couponLoading,
    applyCustomerCoupon,
    removeCustomerCoupon,
    welcomeEligible,
    welcomePercent,
    welcomeDiscount,
    canUseCoupons,
    setPricingPhone,
    placeCustomerOrder,
    verifyUpiPayment,
    paths,
    rid,
    user,
    setLastPlacedOrderId,
    isAuthenticated,
    requirePaymentAuth,
  } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()
  const checkoutPath = withQuery(paths.checkout)
  const cartPath = withQuery(paths.cart)

  const [couponInput, setCouponInput] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    const resolvedName = resolveCustomerFullName(auth?.name, user?.name)
    const resolvedPhone = resolveCustomerPhone(auth?.phone, user?.phone)
    if (resolvedName) setCustomerName(resolvedName)
    if (resolvedPhone) setPhone(resolvedPhone)
  }, [isAuthenticated, auth?.name, auth?.phone, user?.name, user?.phone])

  useEffect(() => {
    setPricingPhone(phone.trim())
  }, [phone, setPricingPhone])

  useEffect(() => {
    if (!isAuthenticated) return
    if (sessionStorage.getItem(RESUME_PAYMENT_KEY) !== '1') return
    sessionStorage.removeItem(RESUME_PAYMENT_KEY)
    const resolvedName = resolveCustomerFullName(auth?.name, user?.name)
    const resolvedPhone = resolveCustomerPhone(auth?.phone, user?.phone)
    if (resolvedName) setCustomerName(resolvedName)
    if (resolvedPhone) setPhone(resolvedPhone)
    setShowPaymentModal(true)
  }, [isAuthenticated, auth, user?.name, user?.phone])

  const applyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) {
      toast.error('Enter a coupon code')
      return
    }
    try {
      await applyCustomerCoupon(code)
      setCouponInput('')
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Invalid coupon')
    }
  }

  const handlePlaceOrder = async ({ paymentTxnId, paymentProof, paymentMethod = 'online' }) => {
    setPlacing(true)
    try {
      const order = await placeCustomerOrder({
        paymentTxnId,
        paymentProof,
        paymentMethod,
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
      setShowPaymentModal(false)
    }
  }

  const handlePayClick = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem(RESUME_PAYMENT_KEY, '1')
      requirePaymentAuth(checkoutPath)
      return
    }
    if (!customerName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }
    setShowPaymentModal(true)
  }

  if (cart.length === 0) {
    navigate(cartPath, { replace: true })
    return null
  }

  return (
    <div className="sv-page pb-28 max-w-lg mx-auto">
      <header className="sticky top-0 z-20 sv-glass border-b border-[var(--sv-border)]/60 px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(cartPath)} className="sv-btn-ghost py-2 px-3 shrink-0">
            <FiArrowLeft size={18} />
          </button>
          <h1 className="sv-display font-bold text-lg flex-1">Checkout</h1>
        </div>
        <CustomerOrderSteps step={3} />
      </header>

      <main className="px-4 py-4 space-y-4">
        {!isAuthenticated && (
          <div className="sv-guest-hint">
            <span className="sv-guest-hint-icon" aria-hidden>🔐</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--sv-text)]">Almost there</p>
              <p className="text-xs text-[var(--sv-text-muted)] mt-0.5 mb-3 leading-relaxed">
                Verify your mobile with OTP to pay and place your order.
              </p>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(RESUME_PAYMENT_KEY, '1')
                  requirePaymentAuth(checkoutPath)
                }}
                className="sv-btn-primary w-full py-2.5 text-sm"
              >
                Log in with OTP
              </button>
            </div>
          </div>
        )}

        <section className="sv-section-card">
          <h2 className="sv-section-title">
            <FiUser size={16} /> Customer details
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

        <section className="sv-section-card">
          <p className="text-xs text-[var(--sv-text-muted)] uppercase tracking-wider mb-1">Dine-in at</p>
          <p className="font-bold text-[var(--sv-text)]">{restaurant.name}</p>
          {restaurant.tableNumber && (
            <span className="sv-table-chip mt-2">Table {restaurant.tableNumber}</span>
          )}
        </section>

        <section className="sv-section-card">
          <h2 className="sv-section-title">Order summary</h2>
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
            {welcomeDiscount > 0 && (
              <div className="flex justify-between text-sm text-[var(--sv-success)]">
                <span>New customer ({welcomePercent}% off)</span>
                <span>-₹{welcomeDiscount}</span>
              </div>
            )}
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

        {welcomeEligible && !canUseCoupons ? (
          <NewCustomerWelcomeOffer
            welcomePercent={welcomePercent}
            welcomeDiscount={welcomeDiscount}
            subtotal={totals.subtotal}
          />
        ) : (
          <MenuPromoCoupons
            coupons={promoCoupons}
            subtotal={totals.subtotal}
            appliedCoupon={appliedCoupon}
            couponLoading={couponLoading}
            onApply={applyCustomerCoupon}
            onRemove={() => {
              removeCustomerCoupon()
              toast.success('Coupon removed')
            }}
            showManualInput
            manualCode={couponInput}
            onManualCodeChange={setCouponInput}
            onManualApply={applyCoupon}
          />
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 sv-sticky-bar sv-sticky-bar--cart md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-2xl">
        <button
          type="button"
          disabled={placing}
          onClick={handlePayClick}
          className="sv-btn-primary w-full py-3.5 disabled:opacity-60"
        >
          {placing ? 'Processing…' : isAuthenticated ? `Pay ₹${totals.total} with Razorpay` : `Log in to Pay ₹${totals.total}`}
        </button>
      </div>

      {showPaymentModal && (
        <SavoriaRazorpayPaymentModal
          amount={totals.total}
          payeeName={restaurant.settings?.upiPayeeName || restaurant.name}
          tableNumber={restaurant.tableNumber}
          customerName={customerName.trim()}
          customerPhone={phone.trim()}
          items={cart}
          appliedCoupon={appliedCoupon}
          subtotal={totals.subtotal}
          tax={totals.gst}
          serviceCharge={totals.service}
          couponDiscount={appliedCoupon?.discountAmount || appliedCoupon?.amount || 0}
          welcomeDiscount={welcomeDiscount}
          welcomePercent={welcomePercent}
          onConfirm={handlePlaceOrder}
          onVerify={verifyUpiPayment}
          onClose={() => setShowPaymentModal(false)}
          placing={placing}
        />
      )}
    </div>
  )
}
