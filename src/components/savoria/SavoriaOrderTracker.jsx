import { useEffect, useState } from 'react'
import { FiCheck, FiClock, FiPackage, FiCoffee } from 'react-icons/fi'

const STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: FiCheck },
  { key: 'preparing', label: 'Preparing', icon: FiCoffee },
  { key: 'ready', label: 'Ready', icon: FiPackage },
  { key: 'served', label: 'Served', icon: FiCheck },
]

export default function SavoriaOrderTracker({ order, live = true }) {
  const [stepIndex, setStepIndex] = useState(order?.currentStep ?? 1)

  useEffect(() => {
    if (!live || !order) return
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 8000)
    return () => clearInterval(interval)
  }, [live, order])

  if (!order) return null

  return (
    <div className="sv-glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-[var(--sv-text-muted)] uppercase tracking-wider">Order Status</p>
          <p className="font-bold text-[var(--sv-text)]">{order.id}</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-[var(--sv-accent)]">
          <FiClock size={16} />
          <span>~{order.estimatedMinutes} min</span>
        </div>
      </div>

      <div className="flex items-start justify-between relative">
        <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-[var(--sv-border)]" />
        <div
          className="absolute top-4 left-[12%] h-0.5 bg-gradient-to-r from-[var(--sv-accent)] to-[var(--sv-accent-2)] transition-all duration-700"
          style={{ width: `${(stepIndex / (STEPS.length - 1)) * 76}%` }}
        />
        {STEPS.map((step, i) => {
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
              <span className={`text-[10px] font-medium text-center ${done ? 'text-[var(--sv-text)]' : 'text-[var(--sv-text-muted)]'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
