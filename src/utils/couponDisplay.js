/** Drop coupons past expiresAt */
export function filterActiveCoupons(coupons = []) {
  const now = Date.now()
  return (coupons || []).filter((coupon) => {
    if (!coupon?.expiresAt) return true
    const expires = new Date(coupon.expiresAt).getTime()
    return !Number.isNaN(expires) && expires >= now
  })
}

export function formatCouponValidUntil(expiresAt) {
  if (!expiresAt) return 'No expiry'
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return null
  if (date.getTime() < Date.now()) return null
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatCouponDiscount(coupon) {
  if (coupon?.discountType === 'percentage') {
    return `${coupon.discount}% off`
  }
  return `₹${coupon.discount} off`
}
