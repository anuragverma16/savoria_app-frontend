import { useLayoutEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { FiClock, FiChevronRight } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import OrderPanelActionBar from '../../components/savoria/OrderPanelActionBar'

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'ready'])

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
}

export default function SavoriaActiveOrdersPage() {
  const navigate = useNavigate()
  const listRef = useRef(null)
  const { orders, restaurant, paths } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.has(o.status)),
    [orders],
  )

  useLayoutEffect(() => {
    const el = listRef.current
    if (!el || !activeOrders.length) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.sv-order-card'),
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.42, stagger: 0.07, ease: 'back.out(1.4)' },
      )
    }, el)
    return () => ctx.revert()
  }, [activeOrders.length])

  return (
    <div className="sv-page pb-8 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 sv-glass border-b border-[var(--sv-border)]/60 px-4 py-4 space-y-3">
        <h1 className="sv-display font-bold text-lg text-[var(--sv-text)]">Active Orders</h1>
        <OrderPanelActionBar active="active" />
      </div>

      <main ref={listRef} className="px-4 py-4">
        {activeOrders.length === 0 ? (
          <div className="text-center py-16 sv-glass rounded-2xl">
            <p className="text-[var(--sv-text-muted)] mb-4">No active orders right now</p>
            <button type="button" onClick={() => navigate(withQuery(paths.menu))} className="sv-btn-primary">
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => navigate(withQuery(paths.orderDetails(order.id)), { state: { order } })}
                className="sv-order-card w-full sv-glass rounded-2xl p-4 text-left hover:border-[var(--sv-accent)]/40 border border-transparent transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--sv-text)] truncate">{order.id}</p>
                    <p className="text-xs text-[var(--sv-text-muted)] mt-0.5">
                      {restaurant.name}
                      {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
                    </p>
                    <p className="text-xs text-[var(--sv-text-muted)] flex items-center gap-1 mt-1">
                      <FiClock size={12} />
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2 shrink-0">
                    <div>
                      <p className="font-bold text-[var(--sv-accent)]">₹{order.grandTotal}</p>
                      <p className="text-xs text-amber-400 font-medium">
                        {STATUS_LABEL[order.status] || order.status}
                      </p>
                    </div>
                    <FiChevronRight className="text-[var(--sv-text-muted)]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
