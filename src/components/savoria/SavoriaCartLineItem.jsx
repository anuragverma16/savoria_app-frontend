import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'

export default function SavoriaCartLineItem({ line, onUpdateQty, onRemove }) {
  return (
    <div className="flex gap-3 p-3 sv-glass rounded-2xl">
      <img
        src={line.image}
        alt={line.name}
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-[var(--sv-text)] truncate">{line.name}</h4>
          <button
            type="button"
            onClick={() => onRemove(line.id)}
            className="text-[var(--sv-text-muted)] hover:text-[var(--sv-danger)] flex-shrink-0"
            aria-label="Remove item"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
        <p className="text-sm text-[var(--sv-accent)] font-semibold mt-0.5">₹{line.price * line.qty}</p>
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onUpdateQty(line.id, line.qty - 1)}
            className="w-8 h-8 rounded-lg sv-glass flex items-center justify-center"
          >
            <FiMinus size={14} />
          </button>
          <span className="w-6 text-center font-semibold">{line.qty}</span>
          <button
            type="button"
            onClick={() => onUpdateQty(line.id, line.qty + 1)}
            className="w-8 h-8 rounded-lg sv-glass flex items-center justify-center"
          >
            <FiPlus size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
