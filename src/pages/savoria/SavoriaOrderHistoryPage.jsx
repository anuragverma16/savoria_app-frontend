import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiClock, FiChevronRight } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'

export default function SavoriaOrderHistoryPage() {
  const navigate = useNavigate()
  const { orders, restaurant, paths } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()

  return (
    <div className="max-w-lg mx-auto pb-8">
      <header className="sticky top-0 z-20 sv-glass px-4 py-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="sv-btn-ghost py-2 px-3">
          <FiArrowLeft size={18} />
        </button>
        <h1 className="sv-display font-bold text-lg flex-1">Order History</h1>
      </header>

      <main className="px-4 py-4">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--sv-text-muted)] mb-4">No orders yet</p>
            <button type="button" onClick={() => navigate(withQuery(paths.menu))} className="sv-btn-primary">
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.button
                key={order.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(withQuery(paths.orderDetails(order.id)), { state: { order } })}
                className="w-full sv-glass rounded-2xl p-4 text-left hover:scale-[1.01] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--sv-text)]">{order.id}</p>
                    <p className="text-xs text-[var(--sv-text-muted)] mt-0.5">
                      {restaurant.name} · Table {order.tableNumber}
                    </p>
                    <p className="text-xs text-[var(--sv-text-muted)] flex items-center gap-1 mt-1">
                      <FiClock size={12} />
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
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
              </motion.button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
