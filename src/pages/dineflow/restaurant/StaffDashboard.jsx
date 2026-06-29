import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiShoppingBag, FiClock, FiCheckCircle, FiGrid, FiList,
  FiCoffee, FiUsers, FiArrowRight,
} from 'react-icons/fi'
import { GiKnifeFork } from 'react-icons/gi'
import { restaurantAPI } from '../../../api/dineflow'
import { io } from 'socket.io-client'
import { formatOrderAddress } from '../../../utils/orderDisplay'
import toast from 'react-hot-toast'

const ACTIVE = ['pending', 'accepted', 'preparing', 'ready']
const NEXT = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'served' }

export default function StaffDashboard() {
  const { user } = useSelector((s) => s.auth)
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const rid = activeRestaurant?._id
  const base = `/restaurant/${rid}`

  useEffect(() => {
    if (!rid) return
    load()
    const socket = io('/', { path: '/socket.io' })
    socket.emit('join-restaurant', rid)
    socket.on('new-order', () => {
      load()
      toast.success('New order received', { icon: '🔔' })
    })
    socket.on('order-updated', load)
    return () => socket.disconnect()
  }, [rid])

  const load = async () => {
    const api = restaurantAPI(rid)
    const [o, t] = await Promise.all([api.orders({ limit: 50 }), api.tables()])
    setOrders(o.data.orders || [])
    setTables(t.data.tables || [])
  }

  const stats = useMemo(() => ({
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length,
    ready: orders.filter((o) => o.status === 'ready').length,
    activeTables: tables.filter((t) => t.status === 'occupied' || (t.activeGuestCount || 0) > 0).length,
    availableTables: tables.filter((t) => t.status === 'available').length,
  }), [orders, tables])

  const needsAction = orders.filter((o) => ACTIVE.includes(o.status)).slice(0, 8)

  const quickUpdate = async (orderId, status) => {
    await restaurantAPI(rid).updateOrderStatus(orderId, status)
    toast.success(`Order marked ${status}`)
    load()
  }

  const quickLinks = [
    { to: `${base}/orders`, label: 'All Orders', icon: FiList, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20' },
    { to: `${base}/kitchen`, label: 'Kitchen Board', icon: GiKnifeFork, color: 'from-violet-500/20 to-violet-600/10 border-violet-500/20' },
    { to: `${base}/tables`, label: 'Tables', icon: FiGrid, color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/20' },
    { to: `${base}/menu-stock`, label: 'Menu Stock', icon: FiCoffee, color: 'from-amber-500/20 to-orange-600/10 border-amber-500/20' },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Staff Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { icon: FiClock, label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { icon: GiKnifeFork, label: 'In Kitchen', value: stats.preparing, color: 'text-violet-400' },
          { icon: FiCheckCircle, label: 'Ready', value: stats.ready, color: 'text-emerald-400' },
          { icon: FiUsers, label: 'Busy Tables', value: stats.activeTables, color: 'text-red-400' },
          { icon: FiGrid, label: 'Available', value: stats.availableTables, color: 'text-cyan-400' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <s.icon className={`text-lg mb-2 ${s.color}`} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`p-4 rounded-2xl bg-gradient-to-br ${link.color} border hover:scale-[1.02] transition-transform`}
          >
            <link.icon className="text-xl mb-2 text-white/80" />
            <p className="font-semibold text-sm">{link.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FiShoppingBag className="text-emerald-400" /> Needs attention
          </h2>
          <Link to={`${base}/orders`} className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            View all <FiArrowRight size={12} />
          </Link>
        </div>

        {needsAction.length === 0 ? (
          <p className="text-white/40 text-sm">No active orders right now.</p>
        ) : (
          <div className="space-y-3">
            {needsAction.map((o) => (
              <div key={o._id} className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-white/5">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-mono text-xs text-emerald-400">{o.orderId}</p>
                  <p className="text-sm font-medium mt-0.5">{o.guest?.name} · T-{o.tableNumber}</p>
                  <p className="text-xs text-white/40 truncate">{formatOrderAddress(o, activeRestaurant)}</p>
                  <p className="text-xs text-white/30 mt-1">
                    {(o.items || []).map((i) => `${i.qty}x ${i.name}`).join(', ')}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-full bg-white/5 text-xs capitalize">{o.status}</span>
                {NEXT[o.status] && (
                  <button
                    type="button"
                    onClick={() => quickUpdate(o._id, NEXT[o.status])}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30"
                  >
                    Mark {NEXT[o.status]}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
