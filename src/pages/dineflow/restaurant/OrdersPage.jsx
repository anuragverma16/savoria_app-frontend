import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { restaurantAPI } from '../../../api/dineflow'
import { io } from 'socket.io-client'
import { getEffectivePanel } from '../../../utils/panelRole'
import { formatOrderAddress, formatOrderDateTime, getOrderCustomerName } from '../../../utils/orderDisplay'

const STAFF_STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'served', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const ADMIN_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'served', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrdersPage() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const { user } = useSelector((s) => s.auth)
  const tenant = useSelector((s) => s.tenant)
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const rid = activeRestaurant?._id

  const panel = getEffectivePanel(user, tenant)
  const isStaffOnly = panel === 'staff'
  const isAdmin = panel === 'admin'

  useEffect(() => {
    if (!rid) return
    load()
    const socket = io('/', { path: '/socket.io' })
    socket.emit('join-restaurant', rid)
    socket.on('new-order', load)
    socket.on('order-updated', load)
    return () => socket.disconnect()
  }, [rid, statusFilter])

  const load = async () => {
    const params = statusFilter ? { status: statusFilter, limit: 100 } : { limit: 100 }
    const { data } = await restaurantAPI(rid).orders(params)
    setOrders(data.orders)
  }

  const updateStatus = async (id, status) => {
    await restaurantAPI(rid).updateOrderStatus(id, status)
    load()
  }

  const statusOptions = isStaffOnly ? STAFF_STATUSES.filter((s) => s.value) : ADMIN_STATUSES

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            {isAdmin ? 'Order History' : 'Staff — Order Updates'}
          </h1>
        </div>
        {isStaffOnly && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="dineflow-select rounded-xl px-4 py-2 text-sm"
          >
            {STAFF_STATUSES.map((s) => (
              <option key={s.value || 'all'} value={s.value} className="bg-slate-900">{s.label}</option>
            ))}
          </select>
        )}
        {isAdmin && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="dineflow-select rounded-xl px-4 py-2 text-sm"
          >
            {STAFF_STATUSES.map((s) => (
              <option key={s.value || 'all'} value={s.value} className="bg-slate-900">{s.label}</option>
            ))}
          </select>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="text-white/40">No orders found.</p>
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="text-white/30 text-xs uppercase border-b border-white/5">
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Date & Time</th>
                <th className="text-left p-4">Table</th>
                <th className="text-left p-4">Address</th>
                <th className="text-left p-4">Order ID</th>
                <th className="text-left p-4">Items</th>
                <th className="text-right p-4">Total</th>
                <th className="text-right p-4">Status</th>
                <th className="text-right p-4">Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-white/5 text-white/60">
                  <td className="p-4">
                    <p className="font-medium text-white/80">{getOrderCustomerName(o)}</p>
                    <span className="text-xs text-white/30">{o.guest?.phone || o.user?.phone}</span>
                  </td>
                  <td className="p-4 text-xs text-white/40 whitespace-nowrap">{formatOrderDateTime(o.createdAt)}</td>
                  <td className="p-4">T-{o.tableNumber || '—'}</td>
                  <td className="p-4 text-xs text-white/40 max-w-[220px] truncate" title={formatOrderAddress(o, activeRestaurant)}>
                    {formatOrderAddress(o, activeRestaurant)}
                  </td>
                  <td className="p-4 font-mono text-xs text-emerald-400">{o.orderId}</td>
                  <td className="p-4">
                    <span className="text-xs">{o.items?.length || 0} items</span>
                    <br />
                    <span className="text-[10px] text-white/30 line-clamp-2">
                      {(o.items || []).map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-amber-200">₹{Number(o.total || 0).toLocaleString()}</td>
                  <td className="p-4 text-right capitalize">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs">{o.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o._id, e.target.value)}
                      className="dineflow-select rounded-lg px-2 py-1.5 text-xs"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value} className="bg-slate-900">{s.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
