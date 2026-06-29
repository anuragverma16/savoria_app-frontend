export function formatOrderAddress(order, restaurant) {
  if (order?.deliveryAddress?.trim()) return order.deliveryAddress.trim()
  if (typeof order?.address === 'string' && order.address.trim()) return order.address.trim()

  const addr = restaurant?.address || order?.restaurant?.address
  if (addr?.street || addr?.city) {
    return [addr.street, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ')
  }

  return order?.orderType === 'delivery' ? 'Delivery' : 'Dine-in at restaurant'
}

export function getOrderTableLabel(order) {
  if (order?.tableNumber) return `Table ${order.tableNumber}`
  if (order?.table?.tableNumber) return `Table ${order.table.tableNumber}`
  if (order?.table?.label) return order.table.label
  return '—'
}

export function getOrderTableId(order) {
  return order?.table?._id || order?.table || null
}

export function getOrderCustomerName(order) {
  return order?.guest?.name || order?.user?.name || 'Guest'
}

export function formatOrderDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatOrderItemCount(order) {
  const n = (order?.items || []).reduce((sum, i) => sum + (Number(i.qty) || 0), 0)
  return n
}

export function formatOrderPaymentLabel(order) {
  const method = (order?.paymentMethod || 'upi').toUpperCase()
  const status = order?.paymentStatus === 'paid' ? 'Paid' : 'Pending'
  return `${method} · ${status}`
}

export function getOrderCouponDiscount(order) {
  const total = Number(order?.discount) || 0
  const welcome = Number(order?.welcomeDiscount) || 0
  return Math.max(0, total - welcome)
}
