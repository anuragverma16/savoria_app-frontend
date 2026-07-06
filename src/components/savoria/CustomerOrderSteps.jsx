/** Visual progress: Menu → Cart → Pay (display only) */
const STEPS = [
  { id: 1, label: 'Menu' },
  { id: 2, label: 'Cart' },
  { id: 3, label: 'Pay' },
]

export default function CustomerOrderSteps({ step = 1 }) {
  return (
    <ol className="sv-order-steps" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = step > s.id
        const active = step === s.id
        return (
          <li
            key={s.id}
            className={`sv-order-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}
          >
            <span className="sv-order-step-dot">{done ? '✓' : s.id}</span>
            <span className="sv-order-step-label">{s.label}</span>
            {i < STEPS.length - 1 && <span className="sv-order-step-line" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}
