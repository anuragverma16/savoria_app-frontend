import { FiDownload, FiMapPin, FiUsers, FiCreditCard, FiShoppingBag } from 'react-icons/fi'
import {
  formatOrderAddress,
  formatOrderDateTime,
  formatOrderItemCount,
  formatOrderPaymentLabel,
  getOrderCouponDiscount,
  getOrderCustomerName,
  getOrderTableId,
  getOrderTableLabel,
} from '../../utils/orderDisplay'
import { downloadOrderInvoice } from '../../utils/generateInvoicePdf'
import toast from 'react-hot-toast'

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

export default function UserOrderHistoryList({
  orders = [],
  defaultRestaurant = null,
  emptyMessage = 'No orders yet.',
  highlightOrderId = null,
}) {
  if (!orders.length) {
    return <p className="text-white/40 py-10 text-center text-sm">{emptyMessage}</p>
  }

  const handleInvoice = async (order) => {
    const restaurant = order.restaurant || defaultRestaurant
    const guestName = getOrderCustomerName(order)
    try {
      await downloadOrderInvoice({
        order,
        restaurant: {
          name: restaurant?.name,
          address: restaurant?.address,
          phone: restaurant?.phone,
          gstNumber: restaurant?.gstNumber,
          settings: restaurant?.settings,
        },
        guestName,
        guestPhone: order.guest?.phone,
      })
      toast.success('Invoice downloaded')
    } catch {
      toast.error('Could not generate invoice')
    }
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const restaurant = order.restaurant || defaultRestaurant
        const address = formatOrderAddress(order, restaurant)
        const tableLabel = getOrderTableLabel(order)
        const tableId = getOrderTableId(order)
        const itemCount = formatOrderItemCount(order)
        const couponOff = getOrderCouponDiscount(order)
        const customerName = getOrderCustomerName(order)

        return (
          <article
            key={order._id}
            className={`p-5 rounded-2xl border transition-colors ${
              highlightOrderId && (order.orderId === highlightOrderId || String(order._id) === String(highlightOrderId))
                ? 'border-emerald-400/60 bg-emerald-500/10 ring-2 ring-emerald-400/30'
                : 'border-white/10 bg-white/[0.03] hover:border-emerald-500/20'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-white">{customerName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 text-white/60 border border-white/10 capitalize">
                    {order.status}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400/80">{order.orderId}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex gap-2 text-white/55">
                    <FiMapPin className="shrink-0 text-emerald-400/80 mt-0.5" size={14} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/30 mb-0.5">Location</p>
                      <p className="text-xs leading-relaxed">{address}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-white/55">
                    <FiUsers className="shrink-0 text-emerald-400/80 mt-0.5" size={14} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/30 mb-0.5">Table</p>
                      <p className="text-xs">{tableLabel}</p>
                      {tableId && (
                        <p className="text-[10px] font-mono text-white/35 mt-0.5 break-all">ID: {tableId}</p>
                      )}
                      {order.guest?.guestCount > 0 && (
                        <p className="text-[10px] text-white/35 mt-0.5">{order.guest.guestCount} guest(s)</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 text-white/55">
                    <FiShoppingBag className="shrink-0 text-emerald-400/80 mt-0.5" size={14} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/30 mb-0.5">Items</p>
                      <p className="text-xs">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">{formatOrderDateTime(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-white/55">
                    <FiCreditCard className="shrink-0 text-emerald-400/80 mt-0.5" size={14} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/30 mb-0.5">Payment</p>
                      <p className="text-xs">{formatOrderPaymentLabel(order)}</p>
                      {order.guest?.phone && (
                        <p className="text-[10px] text-white/35 mt-0.5">{order.guest.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45 pt-1 border-t border-white/5">
                  <span>Subtotal {money(order.subtotal)}</span>
                  <span>GST {money(order.tax)}</span>
                  {order.serviceCharge > 0 && <span>Service {money(order.serviceCharge)}</span>}
                  {order.welcomeDiscount > 0 && <span className="text-emerald-400">Welcome −{money(order.welcomeDiscount)}</span>}
                  {couponOff > 0 && (
                    <span className="text-emerald-400">
                      Coupon{order.couponCode ? ` (${order.couponCode})` : ''} −{money(couponOff)}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 lg:text-right">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/30">Total paid</p>
                  <p className="text-2xl font-bold text-emerald-400">{money(order.total)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInvoice(order)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25"
                >
                  <FiDownload size={14} />
                  Download invoice
                </button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
