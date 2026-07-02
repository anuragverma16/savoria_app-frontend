export default function CartRestaurantSwitchDialog({ open, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md sv-glass rounded-2xl p-6 shadow-2xl">
        <h2 className="sv-display text-lg font-bold text-[var(--sv-text)] mb-2">Switch restaurant?</h2>
        <p className="text-sm text-[var(--sv-text-muted)] leading-relaxed mb-6">
          You already have items from another restaurant. Do you want to clear your current cart?
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="sv-btn-ghost flex-1 py-3">
            Keep cart
          </button>
          <button type="button" onClick={onConfirm} className="sv-btn-primary flex-1 py-3">
            Clear &amp; continue
          </button>
        </div>
      </div>
    </div>
  )
}
