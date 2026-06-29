import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { motion } from 'framer-motion'
import { FiX, FiCopy, FiCheckCircle, FiUpload, FiImage } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function DineflowUpiPaymentModal({
  amount,
  upiId,
  payeeName,
  tableNumber,
  items = [],
  appliedCoupon,
  welcomeDiscount = 0,
  subtotal = 0,
  tax = 0,
  serviceCharge = 0,
  couponDiscount = 0,
  onConfirm,
  onClose,
  onVerify,
  placing = false,
}) {
  const [txnId, setTxnId] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const fileRef = useRef(null)

  const numericAmount = Number(String(amount).replace(/[^0-9.]/g, ''))
  const safeAmount = Number.isFinite(numericAmount) && numericAmount > 0
    ? numericAmount.toFixed(2)
    : null

  const upiUrl = safeAmount && upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Restaurant')}&am=${safeAmount}&cu=INR`
    : null

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId)
    toast.success('UPI ID copied')
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
    setVerified(false)
  }

  const handleVerifyAndConfirm = async () => {
    const id = txnId.trim()
    if (!id) {
      toast.error('Enter UPI transaction / reference ID')
      return
    }
    if (!screenshot) {
      toast.error('Upload payment screenshot')
      return
    }

    setVerifying(true)
    try {
      if (onVerify) {
        await onVerify({ paymentTxnId: id, paymentProof: screenshot, amount: safeAmount })
      }
      await onConfirm({ paymentTxnId: id, paymentProof: screenshot })
      setVerified(true)
    } catch (e) {
      setVerified(false)
      toast.error(e.response?.data?.message || e.message || 'Payment verification failed')
    } finally {
      setVerifying(false)
    }
  }

  if (!safeAmount || !upiId) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
          <p className="text-red-300 text-sm mb-4">
            UPI is not configured for this restaurant. Ask staff to set up UPI in settings.
          </p>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/50 hover:text-white"
        >
          <FiX size={22} />
        </button>

        <div className="p-6 pb-8">
          <h2 className="text-xl font-bold text-white mb-1">UPI Payment</h2>
          <p className="text-sm text-white/45 mb-4">
            {tableNumber ? `Table ${tableNumber}` : 'Dine-in'} · Scan QR and pay ₹{safeAmount}
          </p>

          <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-sm">
            <p className="text-[11px] text-white/40 uppercase tracking-wide mb-2">Order summary</p>
            {items.map((item) => (
              <div key={item.menuItem} className="flex justify-between text-white/70 gap-2">
                <span className="truncate">{item.qty}× {item.name}</span>
                <span className="shrink-0">₹{item.price * item.qty}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex justify-between text-white/50"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-white/50"><span>GST</span><span>₹{tax}</span></div>
              {serviceCharge > 0 && (
                <div className="flex justify-between text-white/50"><span>Service charge</span><span>₹{serviceCharge}</span></div>
              )}
              {couponDiscount > 0 && appliedCoupon?.code && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>−₹{couponDiscount}</span>
                </div>
              )}
              {welcomeDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Welcome discount</span>
                  <span>−₹{welcomeDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-base pt-1">
                <span>Final amount</span>
                <span className="text-emerald-400">₹{safeAmount}</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="inline-block p-3 bg-white rounded-xl mb-3">
              <QRCodeCanvas value={upiUrl} size={180} />
            </div>
            <p className="text-2xl font-bold text-emerald-400 mb-2">₹{safeAmount}</p>
            <a
              href={upiUrl}
              className="inline-block w-full mb-3 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400"
            >
              Open UPI App
            </a>
            <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
              <span className="text-[11px] text-white/40 uppercase tracking-wide mr-1">UPI ID</span>
              <span className="truncate font-mono">{upiId}</span>
              <button type="button" onClick={copyUpi} className="shrink-0 text-emerald-400">
                <FiCopy size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-wide mb-2">Payment screenshot</p>
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-white/70 text-sm hover:border-emerald-500/40 hover:text-emerald-300 transition-colors"
              >
                <FiUpload size={16} />
                {screenshot ? 'Change screenshot' : 'Upload payment screenshot'}
              </button>
              {previewUrl && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-white/10">
                  <img src={previewUrl} alt="Payment proof" className="w-full max-h-40 object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white/80 flex items-center gap-1">
                    <FiImage size={12} /> Screenshot attached
                  </span>
                </div>
              )}
            </div>

            <input
              value={txnId}
              onChange={(e) => { setTxnId(e.target.value); setVerified(false) }}
              placeholder="UPI transaction / reference ID"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
            />

            <p className="text-xs text-white/35">
              After paying via UPI, upload your screenshot and enter the reference ID. Payment is verified before your order is confirmed.
            </p>

            <button
              type="button"
              onClick={handleVerifyAndConfirm}
              disabled={verifying || placing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying || placing ? (
                verifying ? 'Verifying payment...' : 'Placing order...'
              ) : (
                <>
                  <FiCheckCircle /> Verify payment & confirm order
                </>
              )}
            </button>
            {verified && (
              <p className="text-center text-xs text-emerald-400">Payment verified</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
