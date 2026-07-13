import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { motion } from 'framer-motion'
import {
  FiX, FiCopy, FiCheckCircle, FiUpload, FiImage, FiExternalLink, FiShield, FiLock,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getRazorpayPaymentLink, normalizeRazorpayLink } from '../../utils/razorpayPayment'

export default function SavoriaRazorpayPaymentModal({
  amount,
  payeeName = 'Savoria',
  tableNumber,
  customerName,
  customerPhone,
  items = [],
  appliedCoupon,
  subtotal = 0,
  tax = 0,
  serviceCharge = 0,
  couponDiscount = 0,
  welcomeDiscount = 0,
  welcomePercent = 40,
  paymentLink,
  onConfirm,
  onVerify,
  onClose,
  placing = false,
}) {
  const [txnId, setTxnId] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [paidOnRazorpay, setPaidOnRazorpay] = useState(false)
  const fileRef = useRef(null)

  const numericAmount = Number(String(amount).replace(/[^0-9.]/g, ''))
  const safeAmount = Number.isFinite(numericAmount) && numericAmount > 0
    ? Number(numericAmount.toFixed(2))
    : null
  const payUrl = normalizeRazorpayLink(paymentLink || getRazorpayPaymentLink())

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(payUrl)
      toast.success('Payment link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const openRazorpay = () => {
    window.open(payUrl, '_blank', 'noopener,noreferrer')
    setPaidOnRazorpay(true)
  }

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image screenshot')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setScreenshot(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleVerifyAndConfirm = async () => {
    const id = txnId.trim()
    if (!id) {
      toast.error('Enter your Razorpay Payment ID')
      return
    }
    if (!screenshot) {
      toast.error('Upload payment confirmation screenshot')
      return
    }

    setVerifying(true)
    try {
      const payload = {
        paymentTxnId: id,
        paymentProof: screenshot,
        amount: safeAmount,
        paymentMethod: 'online',
      }
      if (onVerify) await onVerify(payload)
      await onConfirm(payload)
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Payment verification failed')
    } finally {
      setVerifying(false)
    }
  }

  if (!safeAmount) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
        <div className="sv-rzp-modal-card w-full max-w-sm text-center p-6">
          <p className="text-red-300 text-sm mb-4">Invalid order amount. Return to cart and try again.</p>
          <button type="button" onClick={onClose} className="sv-btn-primary w-full py-2.5 text-sm">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sv-rzp-modal relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        <div className="sv-rzp-modal-header px-6 pt-6 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="sv-rzp-badge">
              <FiShield size={12} />
              Secured by Razorpay
            </span>
            <span className="sv-rzp-badge sv-rzp-badge--muted">
              <FiLock size={11} />
              256-bit SSL
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Complete payment</h2>
          <p className="text-sm text-white/55 mt-1">
            {tableNumber ? `Table ${tableNumber}` : 'Dine-in'}
            {customerName ? ` · ${customerName}` : ''}
          </p>
        </div>

        <div className="px-6 pb-8 space-y-4">
          <div className="sv-rzp-amount-card">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1">Amount to pay</p>
            <p className="text-3xl font-bold text-white">₹{safeAmount.toFixed(2)}</p>
            <p className="text-xs text-white/45 mt-2">
              Enter this exact amount on the Razorpay page if prompted.
            </p>
          </div>

          <div className="sv-rzp-summary">
            <p className="sv-rzp-summary-title">Order summary</p>
            {items.map((item) => (
              <div key={item.menuItem || item.id} className="flex justify-between text-sm text-white/70 gap-2">
                <span className="truncate">{item.qty}× {item.name}</span>
                <span className="shrink-0">₹{item.price * item.qty}</span>
              </div>
            ))}
            <div className="sv-rzp-summary-totals">
              <div className="flex justify-between text-white/50"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-white/50"><span>GST</span><span>₹{tax}</span></div>
              {serviceCharge > 0 && (
                <div className="flex justify-between text-white/50"><span>Service</span><span>₹{serviceCharge}</span></div>
              )}
              {welcomeDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>New customer ({welcomePercent}% off)</span>
                  <span>−₹{welcomeDiscount}</span>
                </div>
              )}
              {couponDiscount > 0 && appliedCoupon?.code && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>−₹{couponDiscount}</span>
                </div>
              )}
            </div>
          </div>

          <div className="sv-rzp-steps">
            <div className={`sv-rzp-step ${paidOnRazorpay ? 'is-done' : 'is-active'}`}>
              <span className="sv-rzp-step-num">1</span>
              <span>Pay on Razorpay</span>
            </div>
            <div className={`sv-rzp-step ${paidOnRazorpay ? 'is-active' : ''}`}>
              <span className="sv-rzp-step-num">2</span>
              <span>Confirm payment</span>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-block p-3 bg-white rounded-2xl mb-3 shadow-lg">
              <QRCodeCanvas value={payUrl} size={168} level="M" includeMargin />
            </div>
            <p className="text-[11px] text-white/40 mb-3">Scan to open Razorpay on your phone</p>

            <button
              type="button"
              onClick={openRazorpay}
              className="sv-rzp-pay-btn w-full"
            >
              <FiExternalLink size={18} />
              Pay ₹{safeAmount.toFixed(2)} on Razorpay
            </button>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-white/45">
              <span className="truncate font-mono">{payUrl.replace('https://', '')}</span>
              <button type="button" onClick={copyLink} className="shrink-0 text-sky-300 hover:text-sky-200">
                <FiCopy size={14} />
              </button>
            </div>
          </div>

          {paidOnRazorpay && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-1 border-t border-white/10"
            >
              <p className="text-xs text-white/50 pt-2">
                After payment, paste your <strong className="text-white/80">Payment ID</strong> (starts with
                {' '}
                <code className="text-sky-300">pay_</code>
                ) and upload the confirmation screenshot.
              </p>

              <input
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="Razorpay Payment ID — e.g. pay_KlQxPzuON9Lg8x"
                className="sv-rzp-input"
                autoComplete="off"
              />

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="sv-rzp-upload-btn"
              >
                <FiUpload size={16} />
                {screenshot ? 'Change screenshot' : 'Upload payment screenshot'}
              </button>
              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={previewUrl} alt="Payment proof" className="w-full max-h-40 object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white/80 flex items-center gap-1">
                    <FiImage size={12} /> Screenshot attached
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyAndConfirm}
                disabled={verifying || placing}
                className="sv-btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {verifying || placing ? (
                  verifying ? 'Verifying payment…' : 'Placing order…'
                ) : (
                  <>
                    <FiCheckCircle size={18} />
                    Verify & place order
                  </>
                )}
              </button>
            </motion.div>
          )}

          {!paidOnRazorpay && (
            <p className="text-center text-[11px] text-white/35">
              UPI · Cards · Netbanking · Wallets accepted on Razorpay
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
