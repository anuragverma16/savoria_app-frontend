import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiStar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { restaurantAPI } from '../../api/dineflow'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'

function StarPicker({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`p-1 rounded-lg transition-transform active:scale-90 ${
            star <= value
              ? 'text-amber-500'
              : 'text-[var(--sv-text-muted)]/40 hover:text-amber-400'
          } disabled:opacity-50`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <FiStar size={22} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

function OrderItemReviewRow({ line, orderId, restaurantId, guestName }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!rating) {
      toast.error('Tap a star rating first')
      return
    }
    setSubmitting(true)
    try {
      await restaurantAPI(restaurantId).submitMenuReview({
        menuItemId: line.id,
        rating,
        comment: comment.trim(),
        orderId,
        guestName: guestName || undefined,
      })
      setDone(true)
      toast.success(`Thanks for rating ${line.name}!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between gap-3 py-3"
      >
        <span className="text-sm font-medium text-[var(--sv-text)] truncate">{line.name}</span>
        <span className="flex items-center gap-1 text-amber-500 text-sm shrink-0">
          {[...Array(rating)].map((_, i) => (
            <FiStar key={i} size={14} fill="currentColor" />
          ))}
          <span className="text-[var(--sv-success)] text-xs font-semibold ml-1">Rated ✓</span>
        </span>
      </motion.div>
    )
  }

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-[var(--sv-text)] truncate">{line.name}</span>
        <StarPicker value={rating} onChange={setRating} disabled={submitting} />
      </div>
      {rating > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-2 mt-2"
        >
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            placeholder="Add a comment (optional)"
            className="flex-1 rounded-xl border border-[var(--sv-border)] bg-[var(--sv-surface)] px-3 py-2 text-sm text-[var(--sv-text)]"
          />
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="sv-btn-primary text-sm px-4 py-2 shrink-0 disabled:opacity-60"
          >
            {submitting ? '…' : 'Submit'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

/** Post-order rating panel: rate each dish from the placed order */
export default function SavoriaOrderReviewPanel({ order }) {
  const { restaurant, isAuthenticated, userDisplayName } = useSavoriaGuest()
  const restaurantId = restaurant?._id || order?.restaurantId

  const reviewableItems = useMemo(() => {
    const seen = new Set()
    return (order?.items || []).filter((line) => {
      if (!line.id || seen.has(String(line.id))) return false
      seen.add(String(line.id))
      return true
    })
  }, [order])

  if (!isAuthenticated || !restaurantId || reviewableItems.length === 0) return null

  return (
    <div className="sv-glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-0.5">
        <FiStar className="text-amber-500" size={16} fill="currentColor" />
        <h2 className="font-semibold text-[var(--sv-text)]">Rate your dishes</h2>
      </div>
      <p className="text-xs text-[var(--sv-text-muted)] mb-2">
        Your rating updates this dish&apos;s score on the menu instantly.
      </p>
      <div className="divide-y divide-[var(--sv-border)]/50">
        {reviewableItems.map((line) => (
          <OrderItemReviewRow
            key={line.id}
            line={line}
            orderId={order._id || order.id}
            restaurantId={restaurantId}
            guestName={userDisplayName}
          />
        ))}
      </div>
    </div>
  )
}
