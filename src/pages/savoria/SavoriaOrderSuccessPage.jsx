import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { motion } from 'framer-motion'
import { FiDownload, FiHome, FiList, FiShoppingBag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { publicAPI } from '../../api/dineflow'
import { mapCustomerOrder } from '../../utils/mapCustomerMenuItem'
import SavoriaOrderTracker from '../../components/savoria/SavoriaOrderTracker'
import { downloadOrderInvoice } from '../../utils/generateInvoicePdf'

export default function SavoriaOrderSuccessPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { orders, restaurant, paths, refreshOrders } = useSavoriaGuest()
  const checkRef = useRef(null)
  const ringRef = useRef(null)
  const [order, setOrder] = useState(() => location.state?.order || orders.find((o) => o.id === orderId))

  useEffect(() => {
    if (!orderId) return undefined
    let cancelled = false

    const load = async () => {
      try {
        const { data } = await publicAPI.trackOrder(orderId)
        if (!cancelled && data.order) {
          setOrder(mapCustomerOrder(data.order))
        }
      } catch {
        if (!cancelled) refreshOrders?.()
      }
    }

    load()
    const interval = setInterval(load, 12000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [orderId, refreshOrders])

  useEffect(() => {
    if (!checkRef.current) return
    const tl = gsap.timeline()
    tl.fromTo(ringRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
    )
      .fromTo(checkRef.current,
        { scale: 0, rotation: -45 },
        { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2)' },
        '-=0.2',
      )
  }, [])

  const downloadInvoice = async () => {
    try {
      await downloadOrderInvoice({
        order,
        restaurant,
        guestName: order?.customerName,
      })
      toast.success('Invoice downloaded')
    } catch {
      toast.error('Could not download invoice')
    }
  }

  if (!order) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[var(--sv-text-muted)] mb-4">Order not found</p>
        <button type="button" onClick={() => navigate(paths.menu)} className="sv-btn-primary">
          Back to Menu
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 max-w-lg mx-auto pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div
            ref={ringRef}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--sv-success)] to-emerald-400 opacity-20"
          />
          <div
            ref={checkRef}
            className="absolute inset-2 rounded-full bg-gradient-to-br from-[var(--sv-success)] to-emerald-400 flex items-center justify-center text-white text-3xl font-bold"
          >
            ✓
          </div>
        </div>
        <h1 className="sv-display text-3xl font-bold text-[var(--sv-text)] mb-2">Order Successful!</h1>
        <p className="text-[var(--sv-text-muted)] text-sm">
          Your order has been sent to the kitchen.
        </p>
      </motion.div>

      <div className="space-y-4 mb-8">
        <SavoriaOrderTracker order={order} live />
        <div className="sv-glass rounded-2xl p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-[var(--sv-text-muted)]">Order ID</span>
            <span className="font-mono font-semibold">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--sv-text-muted)]">Restaurant</span>
            <span className="font-semibold">{order.restaurantName || restaurant.name}</span>
          </div>
          {order.tableNumber && (
            <div className="flex justify-between">
              <span className="text-[var(--sv-text-muted)]">Table</span>
              <span>{order.tableNumber}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--sv-text-muted)]">Payment</span>
            <span className="capitalize">{order.paymentStatus || 'paid'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--sv-text-muted)]">Est. prep time</span>
            <span className="text-[var(--sv-accent)] font-semibold">~{order.estimatedMinutes} min</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-[var(--sv-text-muted)]">Total</span>
            <span>₹{order.grandTotal}</span>
          </div>
        </div>

        <div className="sv-glass rounded-2xl p-4">
          <p className="text-xs text-[var(--sv-text-muted)] uppercase tracking-wider mb-2">Items</p>
          <div className="space-y-1 text-sm">
            {(order.items || []).map((line) => (
              <div key={`${line.id}-${line.name}`} className="flex justify-between">
                <span className="text-[var(--sv-text-muted)]">{line.qty}× {line.name}</span>
                <span>₹{(line.price || 0) * (line.qty || 1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button type="button" onClick={() => navigate(`${paths.orders}?highlight=${order.id}`)} className="sv-btn-primary w-full py-3.5">
          <FiList size={18} /> View My Orders
        </button>
        <button type="button" onClick={() => navigate(paths.menu)} className="sv-btn-ghost w-full py-3.5">
          <FiShoppingBag size={18} /> Continue Ordering
        </button>
        <button type="button" onClick={() => navigate(paths.menu)} className="sv-btn-ghost w-full py-3.5">
          <FiHome size={18} /> Back to Menu
        </button>
        <button type="button" onClick={downloadInvoice} className="sv-btn-ghost w-full py-3.5">
          <FiDownload size={18} /> Download Invoice
        </button>
      </div>
    </div>
  )
}
