import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { publicAPI } from '../../api/dineflow'
import { mapCustomerOrder } from '../../utils/mapCustomerMenuItem'
import SavoriaOrderTracker from '../../components/savoria/SavoriaOrderTracker'
import SavoriaOrderReviewPanel from '../../components/savoria/SavoriaOrderReviewPanel'

export default function SavoriaOrderDetailsPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { orders, restaurant, paths, addToCart, menuItems } = useSavoriaGuest()
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
        /* use cached order */
      }
    }

    load()
    return () => { cancelled = true }
  }, [orderId])

  const handleReorder = () => {
    if (!order?.items?.length) return
    let added = 0
    order.items.forEach((line) => {
      const menuItem = menuItems.find((m) => m.id === line.id || m.name === line.name)
      if (menuItem && menuItem.isAvailable !== false) {
        if (addToCart(menuItem, line.qty)) added += line.qty
      } else if (addToCart({
        id: line.id,
        _id: line.id,
        name: line.name,
        price: line.price,
        isAvailable: true,
      }, line.qty)) {
        added += line.qty
      }
    })
    if (added > 0) {
      toast.success('Items added to cart')
      navigate(paths.cart)
      return
    }
    toast.error('Could not add items — menu may have changed')
  }

  if (!order) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[var(--sv-text-muted)] mb-4">Order not found</p>
        <button type="button" onClick={() => navigate(paths.orders)} className="sv-btn-primary">
          Back to orders
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      <header className="sticky top-0 z-20 sv-glass px-4 py-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="sv-btn-ghost py-2 px-3">
          <FiArrowLeft size={18} />
        </button>
        <h1 className="sv-display font-bold text-lg flex-1">Order Details</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <div className="sv-glass rounded-2xl p-4">
          <p className="text-xs text-[var(--sv-text-muted)] uppercase tracking-wider">Order ID</p>
          <p className="font-bold text-[var(--sv-text)]">{order.id}</p>
          <p className="text-sm text-[var(--sv-text-muted)] mt-2">
            {restaurant.name} · Table {order.tableNumber}
          </p>
          <p className="text-sm text-[var(--sv-accent)] capitalize mt-1">{order.status}</p>
        </div>

        <SavoriaOrderTracker status={order.status} estimatedMinutes={order.estimatedMinutes} />

        <div className="sv-glass rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold text-[var(--sv-text)]">Items</h2>
          {order.items.map((line) => (
            <div key={`${line.id}-${line.name}`} className="flex justify-between text-sm">
              <span className="text-[var(--sv-text-muted)]">{line.qty}× {line.name}</span>
              <span className="text-[var(--sv-text)]">₹{line.price * line.qty}</span>
            </div>
          ))}
          <div className="border-t border-[var(--sv-border)] pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-[var(--sv-accent)]">₹{order.grandTotal}</span>
          </div>
        </div>

        <SavoriaOrderReviewPanel order={order} />

        <button type="button" onClick={handleReorder} className="sv-btn-primary w-full py-3.5 inline-flex items-center justify-center gap-2">
          <FiRefreshCw size={16} />
          Reorder
        </button>
      </main>
    </div>
  )
}
