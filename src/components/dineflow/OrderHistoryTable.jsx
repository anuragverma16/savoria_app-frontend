import {
  formatOrderAddress,
  formatOrderDateTime,
  getOrderCustomerName,
} from '../../utils/orderDisplay'

export default function OrderHistoryTable({
  orders = [],
  showRestaurant = false,
  variant = 'panel',
  emptyMessage = 'No orders found.',
}) {
  const isPlatform = variant === 'platform'

  if (!orders.length) {
    return <p className={isPlatform ? 'text-stone-500 text-sm py-8 text-center' : 'text-white/40 py-8 text-center'}>{emptyMessage}</p>
  }

  const tableClass = isPlatform
    ? 'w-full text-sm min-w-[980px]'
    : 'w-full text-sm min-w-[880px]'
  const headClass = isPlatform
    ? 'text-stone-400 text-xs uppercase border-b border-orange-500/15'
    : 'text-white/30 text-xs uppercase border-b border-white/5'
  const rowClass = isPlatform
    ? 'border-b border-orange-500/10 text-stone-300'
    : 'border-b border-white/5 text-white/60'
  const wrapClass = isPlatform
    ? 'rounded-2xl platform-card overflow-x-auto'
    : 'rounded-2xl bg-white/5 border border-white/10 overflow-x-auto'

  return (
    <div className={wrapClass}>
      <table className={tableClass}>
        <thead>
          <tr className={headClass}>
            <th className="text-left p-4">Customer</th>
            {showRestaurant && <th className="text-left p-4">Restaurant</th>}
            <th className="text-left p-4">Address</th>
            <th className="text-left p-4">Date & Time</th>
            <th className="text-right p-4">Amount</th>
            <th className="text-right p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const restaurant = o.restaurant || null
            const address = formatOrderAddress(o, restaurant)
            const customerName = getOrderCustomerName(o)
            const phone = o.guest?.phone || o.user?.phone

            return (
              <tr key={o._id} className={rowClass}>
                <td className="p-4">
                  <p className={`font-medium ${isPlatform ? 'text-stone-100' : 'text-white/90'}`}>{customerName}</p>
                  {phone && <p className={`text-xs mt-0.5 ${isPlatform ? 'text-stone-500' : 'text-white/40'}`}>{phone}</p>}
                  <p className={`text-[10px] mt-1 font-mono ${isPlatform ? 'text-orange-400/80' : 'text-emerald-400/80'}`}>{o.orderId}</p>
                </td>
                {showRestaurant && (
                  <td className="p-4">
                    <p className="font-medium">{restaurant?.name || '—'}</p>
                    {restaurant?.address?.city && (
                      <p className="text-xs text-stone-500 mt-0.5">{restaurant.address.city}</p>
                    )}
                  </td>
                )}
                <td className="p-4 text-xs max-w-[240px]" title={address}>
                  <span className="line-clamp-2">{address}</span>
                </td>
                <td className="p-4 text-xs whitespace-nowrap">{formatOrderDateTime(o.createdAt)}</td>
                <td className="p-4 text-right font-semibold text-amber-300">₹{Number(o.total || 0).toLocaleString()}</td>
                <td className="p-4 text-right capitalize">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    isPlatform ? 'bg-orange-500/10 text-orange-200 border border-orange-500/20' : 'bg-white/5'
                  }`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
