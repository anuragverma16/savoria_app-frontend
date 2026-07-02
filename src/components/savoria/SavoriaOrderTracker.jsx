import { useMemo } from 'react'
import { FiCheck, FiClock, FiPackage, FiCoffee, FiXCircle } from 'react-icons/fi'

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: FiClock },
  { key: 'accepted', label: 'Accepted', icon: FiCheck },
  { key: 'preparing', label: 'Preparing', icon: FiCoffee },
  { key: 'ready', label: 'Ready', icon: FiPackage },
  { key: 'served', label: 'Served', icon: FiCheck },
  { key: 'completed', label: 'Completed', icon: FiCheck },
]

function statusIndex(status) {
  const normalized = String(status || 'pending').toLowerCase()
  if (normalized === 'cancelled' || normalized === 'refunded') return -1
  const idx = STATUS_STEPS.findIndex((s) => s.key === normalized)
  return idx >= 0 ? idx : 0
}

export default function SavoriaOrderTracker({ order, live = false }) {
  const stepIndex = useMemo(() => statusIndex(order?.status), [order?.status])
  const cancelled = ['cancelled', 'refunded'].includes(String(order?.status || '').toLowerCase())

  if (!order) return null

  if (cancelled) {
    return (
      <div className="sv-glass rounded-2xl p-5 flex items-center gap-3 text-red-400">
        <FiXCircle size={22} />
        <div>
          <p className="font-bold capitalize">{order.status}</p>
          <p className="text-xs text-[var(--sv-text-muted)]">This order was {order.status}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sv-glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-[var(--sv-text-muted)] uppercase tracking-wider">Order Status</p>
          <p className="font-bold text-[var(--sv-text)] capitalize">{order.status || 'pending'}</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-[var(--sv-accent)]">
          <FiClock size={16} />
          <span>~{order.estimatedMinutes || 15} min</span>
        </div>
      </div>

      <div className="flex items-start justify-between relative">
        <div className="absolute top-4 left-[8%] right-[8%] h-0.5 bg-[var(--sv-border)]" />
        <div
          className="absolute top-4 left-[8%] h-0.5 bg-gradient-to-r from-[var(--sv-accent)] to-[var(--sv-accent-2)] transition-all duration-700"
          style={{ width: `${Math.max(0, (stepIndex / (STATUS_STEPS.length - 1)) * 84)}%` }}
        />
        {STATUS_STEPS.map((step, i) => {
          const Icon = step.icon
          const done = i <= stepIndex
          const active = i === stepIndex
          return (
            <div
              key={step.key}
              className={`sv-order-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}
            >
              <div className="sv-order-step-dot relative z-10">
                <Icon size={14} />
              </div>
              <span className={`text-[9px] font-medium text-center ${done ? 'text-[var(--sv-text)]' : 'text-[var(--sv-text-muted)]'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
      {!live && (
        <p className="text-[10px] text-[var(--sv-text-muted)] mt-4 text-center">Status updates automatically</p>
      )}
    </div>
  )
}
