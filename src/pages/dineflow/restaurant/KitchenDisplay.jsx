import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiClock, FiCheck, FiAlertCircle, FiRefreshCw, FiMapPin } from 'react-icons/fi'
import { restaurantAPI } from '../../../api/dineflow'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { formatOrderAddress } from '../../../utils/orderDisplay'

const STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed']
const NEXT = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'served', served: 'completed' }
const COLORS = { pending: '#f59e0b', accepted: '#3b82f6', preparing: '#8b5cf6', ready: '#10b981', served: '#06b6d4' }

export default function KitchenDisplay() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [orders, setOrders] = useState([])
  const rid = activeRestaurant?._id

  useEffect(() => {
    if (!rid) return
    load()
    const socket = io('/', { path: '/socket.io' })
    socket.emit('join-kitchen', rid)
    socket.on('kitchen-order', load)
    socket.on('new-order', load)
    socket.on('food-ready', (o) => toast.success(`Order ${o.orderId} is ready!`, { icon: '🔔' }))
    const interval = setInterval(load, 15000)
    return () => { socket.disconnect(); clearInterval(interval) }
  }, [rid])

  const load = async () => {
    const { data } = await restaurantAPI(rid).kitchenOrders()
    setOrders(data.orders)
  }

  const updateStatus = async (order, status) => {
    await restaurantAPI(rid).updateOrderStatus(order._id, status)
    load()
  }

  const columns = ['pending', 'accepted', 'preparing', 'ready']

  return (
    <div className="p-6 min-h-screen bg-slate-950">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Display</h1>
          <p className="text-white/40 text-sm">{activeRestaurant?.name}</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-white/5 hover:bg-white/10"><FiRefreshCw /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((status) => (
          <div key={status} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: COLORS[status] }} />
              <h3 className="font-semibold capitalize text-sm">{status}</h3>
              <span className="ml-auto text-xs text-white/30">{orders.filter((o) => o.status === status).length}</span>
            </div>
            <AnimatePresence>
              {orders.filter((o) => o.status === status).map((order) => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 p-4 rounded-xl bg-slate-900 border border-white/5"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-mono text-xs text-emerald-400">{order.orderId}</span>
                    <span className="text-xs text-white/30">T-{order.tableNumber}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{order.guest?.name}</p>
                  <p className="text-xs text-white/40 mb-2 flex items-start gap-1">
                    <FiMapPin className="shrink-0 mt-0.5" size={11} />
                    <span>{formatOrderAddress(order, activeRestaurant)}</span>
                  </p>
                  <ul className="text-xs text-white/50 space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <li key={i}>{item.qty}x {item.name}</li>
                    ))}
                  </ul>
                  {NEXT[order.status] && (
                    <button
                      onClick={() => updateStatus(order, NEXT[order.status])}
                      className="w-full py-2 rounded-lg text-xs font-medium text-white"
                      style={{ background: COLORS[NEXT[order.status]] || '#8b5cf6' }}
                    >
                      Mark {NEXT[order.status]}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
