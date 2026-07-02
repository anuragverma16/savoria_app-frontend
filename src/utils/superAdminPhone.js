/** Demo / platform super admin login number */
export const SUPERADMIN_PHONE_DIGITS = '9336331435'

export function normalizePhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export function isSuperAdminPhone(phone) {
  const digits = normalizePhoneDigits(phone)
  return digits.endsWith(SUPERADMIN_PHONE_DIGITS)
}

export function shouldOpenSuperAdminPanel(user, phoneHint) {
  if (!user && !phoneHint) return false
  if (user?.platformRole === 'superadmin' || user?.role === 'superadmin') return true
  return isSuperAdminPhone(user?.phone || phoneHint)
}
