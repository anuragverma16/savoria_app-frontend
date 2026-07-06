/** Role / auto labels — never show as a customer display name */
const PLACEHOLDER_TOKENS = /^(staff|admin|user|superadmin|manager|waiter|chef|cashier|customer|custom|guest|member|account|there)$/i

/** Names auto-assigned at OTP signup — prompt customer to set a real name */
export function isPlaceholderCustomerName(name) {
  const n = String(name || '').trim()
  if (!n) return true
  if (/^guest(\s+\d+)?$/i.test(n)) return true
  if (/^default(\s+user)?$/i.test(n)) return true
  const first = n.split(/\s+/)[0]
  if (PLACEHOLDER_TOKENS.test(first) && n.split(/\s+/).length === 1) return true
  if (PLACEHOLDER_TOKENS.test(n)) return true
  return false
}

export function formatCustomerFirstName(name, fallback = 'Guest') {
  const n = String(name || '').trim()
  if (isPlaceholderCustomerName(n)) return fallback
  return n.split(/\s+/)[0]
}

export function formatCustomerFullName(name, fallback = '') {
  const n = String(name || '').trim()
  if (isPlaceholderCustomerName(n)) return fallback
  return n
}

/** Pick the first real name from session auth, redux user, etc. */
export function resolveCustomerDisplayName(...sources) {
  for (const source of sources) {
    const first = formatCustomerFirstName(source, '')
    if (first) return first
  }
  return ''
}

export function resolveCustomerFullName(...sources) {
  for (const source of sources) {
    const full = formatCustomerFullName(source, '')
    if (full) return full
  }
  return ''
}
