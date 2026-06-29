/** True on phones / small touch devices — dine-in QR flow is mobile-only */
export function isMobileUser() {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const touch = navigator.maxTouchPoints > 0
  const narrow = window.matchMedia('(max-width: 768px)').matches
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  return mobileUa || (touch && narrow)
}
