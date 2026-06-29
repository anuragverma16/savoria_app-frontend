import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { motion } from 'framer-motion'
import { FiDownload, FiHome, FiList } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import SavoriaOrderTracker from '../../components/savoria/SavoriaOrderTracker'

export default function SavoriaOrderSuccessPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { orders, restaurant } = useSavoriaGuest()
  const checkRef = useRef(null)
  const ringRef = useRef(null)

  const order = location.state?.order
    || orders.find((o) => o.id === orderId)
    || orders[0]

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

  const downloadInvoice = () => {
    toast.success('Invoice download started')
    const content = `
SAVORIA INVOICE
Order: ${order?.id}
Restaurant: ${restaurant.name}
Table: ${order?.tableNumber}
Customer: ${order?.customerName}
Total: ₹${order?.grandTotal}
Payment: ${order?.paymentMethod}
Date: ${new Date(order?.createdAt).toLocaleString()}
    `.trim()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${order?.id}-invoice.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!order) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[var(--sv-text-muted)] mb-4">Order not found</p>
        <button type="button" onClick={() => navigate('/order/menu')} className="sv-btn-primary">
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
        <h1 className="sv-display text-3xl font-bold text-[var(--sv-text)] mb-2">Order Placed!</h1>
        <p className="text-[var(--sv-text-muted)] text-sm">
          Your order has been sent to the kitchen. Sit back and relax.
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
            <span className="text-[var(--sv-text-muted)]">Est. prep time</span>
            <span className="text-[var(--sv-accent)] font-semibold">~{order.estimatedMinutes} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--sv-text-muted)]">Amount paid</span>
            <span className="font-bold">₹{order.grandTotal}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button type="button" onClick={downloadInvoice} className="sv-btn-ghost w-full py-3.5">
          <FiDownload size={18} /> Download Invoice
        </button>
        <button type="button" onClick={() => navigate('/order/history')} className="sv-btn-ghost w-full py-3.5">
          <FiList size={18} /> Order History
        </button>
        <button type="button" onClick={() => navigate('/order/menu')} className="sv-btn-primary w-full py-3.5">
          <FiHome size={18} /> Order More
        </button>
      </div>
    </div>
  )
}
