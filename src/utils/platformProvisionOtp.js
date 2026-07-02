export function normalizeProvisionPhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(0, 10)
}
