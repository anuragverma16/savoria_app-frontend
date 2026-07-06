import { useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { FiClock, FiChevronRight } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import OrderPanelActionBar from '../../components/savoria/OrderPanelActionBar'

export default function SavoriaOrderHistoryPage() {
  const navigate = useNavigate()
  const listRef = useRef(null)
  const { orders, restaurant, paths } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()

  useLayoutEffect(() => {
    const el = listRef.current
    if (!el || !orders.length) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.sv-order-card'),
        { opacity: 0, x: -18 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
      )
    }, el)
    return () => ctx.revert()
  }, [orders.length])

  return (
    <div className="sv-page pb-8 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 sv-glass border-b border-[var(--sv-border)]/60 px-4 py-4 space-y-3">
        <h1 className="sv-display font-bold text-lg text-[var(--sv-text)]">Order History</h1>
        <OrderPanelActionBar active="history" />
      </div>

      <main ref={listRef} className="px-4 py-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 sv-glass rounded-2xl">
            <p className="text-[var(--sv-text-muted)] mb-4">No orders yet</p>
            <button type="button" onClick={() => navigate(withQuery(paths.menu))} className="sv-btn-primary">
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
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
                      <p className="text-xs text-[var(--sv-success)] capitalize">{order.status}</p>
                    </div>
                    <FiChevronRight className="text-[var(--sv-text-muted)]" />
                  </div>
                </div>
                <p className="text-xs text-[var(--sv-text-muted)] mt-2 truncate">
                  {order.items.map((l) => `${l.qty}× ${l.name}`).join(', ')}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
