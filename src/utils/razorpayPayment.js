/** Platform Razorpay.me payment page — override via VITE_RAZORPAY_PAYMENT_LINK */
export const DEFAULT_RAZORPAY_PAYMENT_LINK = 'https://razorpay.me/@anuragverma7519'

export function getRazorpayPaymentLink() {
  const fromEnv = (import.meta.env.VITE_RAZORPAY_PAYMENT_LINK || '').trim()
  return normalizeRazorpayLink(fromEnv || DEFAULT_RAZORPAY_PAYMENT_LINK)
}

export function normalizeRazorpayLink(link) {
  const raw = String(link || '').trim()
  if (!raw) return DEFAULT_RAZORPAY_PAYMENT_LINK
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, '')
  const handle = raw.replace(/^@/, '')
  return `https://razorpay.me/@${handle}`
}

export function isRazorpayPaymentId(id) {
  return /^pay_[a-zA-Z0-9]{8,}$/i.test(String(id || '').trim())
}
