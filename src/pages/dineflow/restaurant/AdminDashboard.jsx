import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiShoppingBag, FiDollarSign, FiGrid, FiUsers, FiTrendingUp } from 'react-icons/fi'
import { restaurantAPI } from '../../../api/dineflow'
import { io } from 'socket.io-client'
import { formatOrderAddress } from '../../../utils/orderDisplay'

export default function RestaurantAdminDashboard() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [analytics, setAnalytics] = useState(null)
  const [orders, setOrders] = useState([])
  const rid = activeRestaurant?._id

  useEffect(() => {
    if (!rid) return
    load()
    const socket = io('/', { path: '/socket.io' })
    socket.emit('join-restaurant', rid)
    socket.on('new-order', (order) => {
      setOrders((prev) => [order, ...prev])
    })
    socket.on('order-updated', (order) => {
      setOrders((prev) => prev.map((o) => o._id === order._id ? order : o))
    })
    return () => socket.disconnect()
  }, [rid])

  const load = async () => {
    if (!rid) return
    try {
      const api = restaurantAPI(rid)
      const [a, o] = await Promise.all([api.analytics(), api.orders({ limit: 10 })])
      setAnalytics(a.data.analytics)
      setOrders(o.data.orders || [])
    } catch {
      setAnalytics({ totalOrders: 0, revenue: 0, menuItems: 0, customers: 0 })
      setOrders([])
    }
  }

  const stats = [
    { icon: FiShoppingBag, label: 'Total Orders', value: analytics?.totalOrders || 0, color: 'text-blue-400' },
    { icon: FiDollarSign, label: 'Revenue', value: `₹${(analytics?.revenue || 0).toLocaleString()}`, color: 'text-emerald-400' },
    { icon: FiGrid, label: 'Menu Items', value: analytics?.menuItems || 0, color: 'text-violet-400' },
    { icon: FiUsers, label: 'Customers', value: analytics?.customers || 0, color: 'text-amber-400' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{activeRestaurant?.name}</h1>
        <p className="text-white/40 text-sm">{activeRestaurant?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <s.icon className={`text-xl mb-2 ${s.color}`} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><FiTrendingUp /> Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs uppercase border-b border-white/5">
                <th className="text-left pb-3">Order</th>
                <th className="text-left pb-3">Table</th>
                <th className="text-left pb-3">Address</th>
                <th className="text-left pb-3">Guest</th>
                <th className="text-right pb-3">Total</th>
                <th className="text-right pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => (
                <tr key={o._id} className="text-white/60">
                  <td className="py-3 font-mono text-xs text-emerald-400">{o.orderId}</td>
                  <td className="py-3">T-{o.tableNumber}</td>
                  <td className="py-3 text-xs text-white/40 max-w-[200px] truncate" title={formatOrderAddress(o, activeRestaurant)}>
                    {formatOrderAddress(o, activeRestaurant)}
                  </td>
                  <td className="py-3">{o.guest?.name}</td>
                  <td className="py-3 text-right">₹{o.total}</td>
                  <td className="py-3 text-right capitalize"><span className="px-2 py-0.5 rounded-full bg-white/5 text-xs">{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
